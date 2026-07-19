import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, FormField, FormSelect } from "@/components/ui";
import { createInvoice } from "@/lib/actions/fees";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExportCSVLink } from "@/components/csv-export-link";
import Link from "next/link";
import { Printer } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import FeesList from "./fees-list";
import { BulkInvoiceForm, MarkOverdueButton } from "./bulk-invoice-form";

const STATUS_TONE = {
  PAID: "success", PARTIAL: "warn", UNPAID: "neutral", OVERDUE: "danger",
} as const;

export default async function FeesPage() {
  const user = await requireUser();

  if (user.role === "STUDENT" || user.role === "PARENT") {
    return <FamilyFees userId={user.id} role={user.role} />;
  }

  const [invoices, students, classRooms] = await Promise.all([
    prisma.feeInvoice.findMany({
      orderBy: { dueDate: "desc" },
      include: { student: true, payments: true },
    }),
    prisma.student.findMany({ orderBy: { firstName: "asc" } }),
    prisma.classRoom.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { students: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Fees"
        description="Invoice students and record payments."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportCSVLink href="/api/export/fees" label="Export CSV" />
            <MarkOverdueButton />
          </div>
        }
      />

      {/* Create invoice form */}
      <Card className="p-5 mb-6">
        <h2 className="font-display font-semibold text-ink mb-4 text-sm">New invoice</h2>
        <form action={createInvoice} className="grid sm:grid-cols-4 gap-3 items-end" aria-label="Create a fee invoice">
          <FormSelect label="Student" name="studentId" required>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.admissionNo})
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

        {/* Bulk form */}
        <BulkInvoiceForm
          classRooms={classRooms.map((c) => ({
            id: c.id,
            name: c.name,
            studentCount: c._count.students,
          }))}
        />
      </Card>

      {/* Searchable / filterable invoice list */}
      {invoices.length === 0 ? (
        <Card><EmptyState title="No invoices yet" /></Card>
      ) : (
        <FeesList
          invoices={invoices.map((inv) => ({
            id: inv.id,
            title: inv.title,
            amount: inv.amount,
            dueDate: inv.dueDate,
            status: inv.status as "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE",
            student: {
              id: inv.student.id,
              firstName: inv.student.firstName,
              lastName: inv.student.lastName,
              admissionNo: inv.student.admissionNo,
            },
            payments: inv.payments.map((p) => ({ amount: p.amount })),
          }))}
        />
      )}
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
      include: { children: { include: { feeInvoices: { include: { payments: true }, orderBy: { dueDate: "desc" } } } } },
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
