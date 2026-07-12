import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/org";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function FeeReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [invoice, org] = await Promise.all([
    prisma.feeInvoice.findUnique({
      where: { id },
      include: {
        student: { include: { classRoom: true } },
        payments: { orderBy: { paidOn: "asc" } },
      },
    }),
    getOrganization(),
  ]);

  if (!invoice) notFound();

  // Students and parents can only view their own receipts
  if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (student?.id !== invoice.studentId) notFound();
  }
  if (user.role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: { children: true },
    });
    if (!parent?.children.some((c) => c.id === invoice.studentId)) notFound();
  }

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoice.amount - totalPaid;

  return (
    <div className="min-h-screen bg-background">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden flex items-center gap-3 p-4 border-b border-border bg-surface">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-soft transition-colors"
        >
          🖨️ Print receipt
        </button>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-border/50 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Receipt — this is what gets printed */}
      <div
        id="receipt"
        className="max-w-2xl mx-auto bg-surface shadow-sm print:shadow-none p-10 print:p-6 mt-6 print:mt-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-primary">
          <div className="flex items-center gap-3">
            {org.logoUrl && (
              <Image
                src={org.logoUrl}
                alt={`${org.name} logo`}
                width={64}
                height={64}
                className="object-contain rounded"
              />
            )}
            <div>
              <h1 className="font-display text-xl font-extrabold text-primary">{org.name}</h1>
              {org.address && (
                <p className="text-xs text-ink-soft mt-0.5 whitespace-pre-line">{org.address}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-lg text-primary">FEE RECEIPT</p>
            <p className="text-xs text-ink-soft mt-0.5">Date: {formatDate(new Date())}</p>
            <p className="text-xs text-ink-soft">Receipt #: {invoice.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Student details */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1.5">
              Student
            </p>
            <p className="font-medium">
              {invoice.student.firstName} {invoice.student.lastName}
            </p>
            <p className="text-sm text-ink-soft">{invoice.student.admissionNo}</p>
            {invoice.student.classRoom && (
              <p className="text-sm text-ink-soft">{invoice.student.classRoom.name}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1.5">
              Invoice details
            </p>
            <p className="font-medium">{invoice.title}</p>
            <p className="text-sm text-ink-soft">Due: {formatDate(invoice.dueDate)}</p>
            <p className="text-sm font-medium mt-1">
              Status:{" "}
              <span
                className={
                  invoice.status === "PAID"
                    ? "text-success"
                    : invoice.status === "OVERDUE"
                    ? "text-danger"
                    : "text-warn"
                }
              >
                {invoice.status}
              </span>
            </p>
          </div>
        </div>

        {/* Amount summary */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-ink-soft font-medium">Description</th>
              <th className="text-right py-2 text-ink-soft font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2.5">{invoice.title}</td>
              <td className="py-2.5 text-right font-medium">
                {formatCurrency(invoice.amount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-b border-border">
              <td className="py-2 text-ink-soft text-xs">Total charged</td>
              <td className="py-2 text-right">{formatCurrency(invoice.amount)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 text-ink-soft text-xs">Total paid</td>
              <td className="py-2 text-right text-success">{formatCurrency(totalPaid)}</td>
            </tr>
            <tr>
              <td className="py-3 font-display font-bold text-primary">Balance due</td>
              <td className="py-3 text-right font-display font-bold text-primary text-lg">
                {formatCurrency(balance < 0 ? 0 : balance)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment history */}
        {invoice.payments.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
              Payment history
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 text-ink-soft font-medium">Date</th>
                  <th className="text-left py-1.5 text-ink-soft font-medium">Method</th>
                  <th className="text-right py-1.5 text-ink-soft font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-1.5">{formatDate(p.paidOn)}</td>
                    <td className="py-1.5 capitalize">{p.method ?? "—"}</td>
                    <td className="py-1.5 text-right">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-4 text-center text-xs text-ink-soft">
          <p>This is a computer-generated receipt and does not require a signature.</p>
          <p className="mt-1">{org.name} · Generated on {formatDate(new Date())}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}
