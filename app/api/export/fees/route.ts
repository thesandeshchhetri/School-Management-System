import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const invoices = await prisma.feeInvoice.findMany({
    orderBy: { dueDate: "desc" },
    include: { student: true, payments: true },
  });

  const csv = toCSV(
    invoices.map((inv) => ({
      student: `${inv.student.firstName} ${inv.student.lastName}`,
      admissionNo: inv.student.admissionNo,
      title: inv.title,
      amount: inv.amount,
      paid: inv.payments.reduce((sum, p) => sum + p.amount, 0),
      status: inv.status,
      dueDate: inv.dueDate,
    })),
    [
      { key: "student", label: "Student" },
      { key: "admissionNo", label: "Admission No" },
      { key: "title", label: "Invoice" },
      { key: "amount", label: "Amount" },
      { key: "paid", label: "Paid" },
      { key: "status", label: "Status" },
      { key: "dueDate", label: "Due Date" },
    ]
  );

  return csvResponse("fees.csv", csv);
}
