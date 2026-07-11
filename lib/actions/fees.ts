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

export async function recordPayment(formData: FormData) {
  await assertRole(["ADMIN"]);

  const invoiceId = formData.get("invoiceId") as string;
  const amount = Number(formData.get("amount"));
  const method = (formData.get("method") as string) || null;

  await prisma.feePayment.create({
    data: { invoiceId, amount, method },
  });

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
