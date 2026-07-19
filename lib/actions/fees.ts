"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function createInvoice(formData: FormData) {
  await assertRole(["ADMIN"]);

  await prisma.feeInvoice.create({
    data: {
      studentId: formData.get("studentId") as string,
      title: formData.get("title") as string,
      amount: Number(formData.get("amount")),
      dueDate: new Date(formData.get("dueDate") as string),
    },
  });

  revalidatePath("/fees");
}

/**
 * Create one invoice for every student in a class.
 * Skips students who already have an invoice with the same title.
 */
export async function bulkCreateInvoice(
  _prev: { ok?: boolean; error?: string; created?: number } | undefined,
  formData: FormData
): Promise<{ ok?: boolean; error?: string; created?: number }> {
  try {
    await assertRole(["ADMIN"]);

    const classRoomId = formData.get("classRoomId") as string;
    const title       = formData.get("title") as string;
    const amount      = Number(formData.get("amount"));
    const dueDate     = new Date(formData.get("dueDate") as string);

    if (!classRoomId || !title || !amount || isNaN(dueDate.getTime())) {
      return { error: "All fields are required." };
    }

    const students = await prisma.student.findMany({ where: { classRoomId } });
    if (students.length === 0) return { error: "No students found in this class." };

    // Skip students who already have an invoice with this exact title
    const existing = await prisma.feeInvoice.findMany({
      where: { title, student: { classRoomId } },
      select: { studentId: true },
    });
    const existingIds = new Set(existing.map((e) => e.studentId));
    const toCreate = students.filter((s) => !existingIds.has(s.id));

    if (toCreate.length === 0) {
      return { error: `All students in this class already have an invoice titled "${title}".` };
    }

    await prisma.feeInvoice.createMany({
      data: toCreate.map((s) => ({
        studentId: s.id,
        title,
        amount,
        dueDate,
        status: "UNPAID" as const,
      })),
    });

    revalidatePath("/fees");
    return { ok: true, created: toCreate.length };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Mark all past-due UNPAID invoices as OVERDUE.
 * Called on demand from the fees page.
 */
export async function markOverdueInvoices() {
  await assertRole(["ADMIN"]);

  const now = new Date();
  const result = await prisma.feeInvoice.updateMany({
    where: { status: { in: ["UNPAID", "PARTIAL"] }, dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  revalidatePath("/fees");
  return { updated: result.count };
}

export async function recordPayment(formData: FormData) {
  await assertRole(["ADMIN"]);

  const invoiceId = formData.get("invoiceId") as string;
  const amount    = Number(formData.get("amount"));
  const method    = (formData.get("method") as string) || null;

  await prisma.feePayment.create({ data: { invoiceId, amount, method } });

  const invoice = await prisma.feeInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { payments: true },
  });
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

  await prisma.feeInvoice.update({
    where: { id: invoiceId },
    data: {
      status: totalPaid >= invoice.amount ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID",
    },
  });

  revalidatePath("/fees");
}

export async function deleteInvoice(id: string) {
  await assertRole(["ADMIN"]);
  await prisma.feeInvoice.delete({ where: { id } });
  revalidatePath("/fees");
}
