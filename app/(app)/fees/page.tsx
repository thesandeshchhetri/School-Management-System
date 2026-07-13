import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, Badge, EmptyState, FormField, FormSelect } from "@/components/ui";
import { createInvoice, recordPayment } from "@/lib/actions/fees";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceDeleteButton from "./delete-button";
import { ExportCSVLink } from "@/components/csv-export-link";
import Link from "next/link";
import { Printer } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";

const STATUS_TONE = {
  PAID: "success",
  PARTIAL: "warn",
  UNPAID: "neutral",
  OVERDUE: "danger",
} as const;

export default async function FeesPage() {
  const user = await requireUser();

  if (user.role === "STUDENT" || user.role === "PARENT") {
    return <FamilyFees userId={user.id} role={user.role} />;
  }

  const [invoices, students] = await Promise.all([
    prisma.feeInvoice.findMany({
      orderBy: { dueDate: "desc" },
      include: { student: true, payments: true },
    }),
    prisma.student.findMany({ orderBy: { firstName: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Fees"
        description="Invoice students and record payments."
        action={<ExportCSVLink href="/api/export/fees" label="Export CSV" />}
      />

      <Card className="p-5 mb-6">
        <form action={createInvoice} className="grid sm:grid-cols-4 gap-3 items-end" aria-label="Create a fee invoice">
          <FormSelect label="Student" name="studentId" required>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </FormSelect>
          <FormField label="Title" name="title" required placeholder="Term 1 Tuition" />
          <FormField label="Amount" name="amount" type="number" step="0.01" required />
          <FormField label="Due date" name="dueDate" type="date" required />
          <div className="sm:col-span-4">
            <SubmitButton>Create invoice</SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" />
        ) : (
          <div className="divide-y divide-border">
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
              return (
                <div key={inv.id} className="px-4 sm:px-5 py-4">
                  {/* Top row: info + badge + icons */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {inv.student.firstName} {inv.student.lastName} · {inv.title}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {formatCurrency(paid)} of {formatCurrency(inv.amount)} paid · due {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={STATUS_TONE[inv.status as keyof typeof STATUS_TONE]}>{inv.status}</Badge>
                      <Link
                        href={`/fees/receipt/${inv.id}`}
                        target="_blank"
                        className="p-1.5 rounded-md hover:bg-border text-ink-soft"
                        aria-label={`Print receipt for ${inv.title}`}
                      >
                        <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                      <InvoiceDeleteButton id={inv.id} label={inv.title} />
                    </div>
                  </div>
                  {/* Payment form below on its own row — full width on mobile */}
                  {inv.status !== "PAID" && (
                    <form
                      action={recordPayment}
                      className="mt-3 flex flex-wrap items-center gap-2"
                      aria-label={`Record a payment for ${inv.title}`}
                    >
                      <input type="hidden" name="invoiceId" value={inv.id} />
                      <input
                        type="number"
                        step="0.01"
                        name="amount"
                        placeholder="Amount"
                        aria-label={`Payment amount for ${inv.title}`}
                        required
                        className="input w-32 flex-1 min-w-[100px]"
                      />
                      <select
                        name="method"
                        aria-label={`Payment method for ${inv.title}`}
                        className="input flex-1 min-w-[120px]"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank transfer">Bank transfer</option>
                      </select>
                      <SubmitButton variant="ghost" className="whitespace-nowrap w-full sm:w-auto">
                        Record payment
                      </SubmitButton>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

async function FamilyFees({ userId, role }: { userId: string; role: string }) {
  let student = await prisma.student.findUnique({
    where: { userId },
    include: { feeInvoices: { include: { payments: true }, orderBy: { dueDate: "desc" } } },
  });

  if (!student && role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        children: {
          include: { feeInvoices: { include: { payments: true }, orderBy: { dueDate: "desc" } } },
        },
      },
    });
    student = parent?.children[0] ?? null;
  }

  if (!student) {
    return (
      <div>
        <PageHeader title="Fees" />
        <EmptyState title="No student record linked" description="Contact your school admin." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Fees" description={`${student.firstName}'s invoices`} />
      <Card className="overflow-hidden">
        {student.feeInvoices.length === 0 ? (
          <EmptyState title="No invoices yet" />
        ) : (
          <div className="divide-y divide-border">
            {student.feeInvoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
              return (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{inv.title}</p>
                    <p className="text-xs text-ink-soft">
                      {formatCurrency(paid)} of {formatCurrency(inv.amount)} paid · due {formatDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[inv.status as keyof typeof STATUS_TONE]}>{inv.status}</Badge>
                    <Link
                      href={`/fees/receipt/${inv.id}`}
                      target="_blank"
                      className="p-1.5 rounded-md hover:bg-border text-ink-soft"
                      aria-label={`Print receipt for ${inv.title}`}
                    >
                      <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
