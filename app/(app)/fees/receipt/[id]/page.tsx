import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/org";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";
import PrintControls from "./print-controls";

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
    <>
      <style>{`
        @media print {
          #receipt-controls { display: none !important; }
          #receipt-wrapper {
            margin: 0 !important;
            padding: 1.5rem !important;
            box-shadow: none !important;
            max-width: 100% !important;
          }
          body { background: white !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>

      <PrintControls />

      <div
        id="receipt-wrapper"
        style={{
          maxWidth: "672px",
          margin: "1.5rem auto",
          background: "white",
          boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
          padding: "2.5rem",
          borderRadius: "12px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "2px solid #4F46E5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {org.logoUrl && (
              <Image src={org.logoUrl} alt={`${org.name} logo`} width={64} height={64} style={{ objectFit: "contain", borderRadius: "4px" }} />
            )}
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.125rem", color: "#1A1635", margin: 0 }}>{org.name}</h1>
              {org.address && (
                <p style={{ fontSize: "0.75rem", color: "#6B6B8A", marginTop: "2px", whiteSpace: "pre-line" }}>{org.address}</p>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: 700, fontSize: "1.125rem", color: "#4F46E5", margin: 0 }}>FEE RECEIPT</p>
            <p style={{ fontSize: "0.75rem", color: "#6B6B8A", marginTop: "2px" }}>Date: {formatDate(new Date())}</p>
            <p style={{ fontSize: "0.75rem", color: "#6B6B8A" }}>Receipt #: {invoice.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Student + Invoice details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B6B8A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Student</p>
            <p style={{ fontWeight: 600, margin: "0 0 2px" }}>{invoice.student.firstName} {invoice.student.lastName}</p>
            <p style={{ fontSize: "0.875rem", color: "#6B6B8A", margin: "0 0 2px" }}>{invoice.student.admissionNo}</p>
            {invoice.student.classRoom && (
              <p style={{ fontSize: "0.875rem", color: "#6B6B8A", margin: 0 }}>{invoice.student.classRoom.name}</p>
            )}
          </div>
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B6B8A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Invoice details</p>
            <p style={{ fontWeight: 600, margin: "0 0 2px" }}>{invoice.title}</p>
            <p style={{ fontSize: "0.875rem", color: "#6B6B8A", margin: "0 0 2px" }}>Due: {formatDate(invoice.dueDate)}</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0, color: invoice.status === "PAID" ? "#059669" : invoice.status === "OVERDUE" ? "#DC2626" : "#D97706" }}>
              {invoice.status}
            </p>
          </div>
        </div>

        {/* Amount table */}
        <table style={{ width: "100%", fontSize: "0.875rem", marginBottom: "2rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2DFF5" }}>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#6B6B8A", fontWeight: 500 }}>Description</th>
              <th style={{ textAlign: "right", padding: "8px 0", color: "#6B6B8A", fontWeight: 500 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #E2DFF5" }}>
              <td style={{ padding: "10px 0" }}>{invoice.title}</td>
              <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600 }}>{formatCurrency(invoice.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ borderBottom: "1px solid #E2DFF5" }}>
              <td style={{ padding: "8px 0", fontSize: "0.75rem", color: "#6B6B8A" }}>Total charged</td>
              <td style={{ padding: "8px 0", textAlign: "right" }}>{formatCurrency(invoice.amount)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #E2DFF5" }}>
              <td style={{ padding: "8px 0", fontSize: "0.75rem", color: "#6B6B8A" }}>Total paid</td>
              <td style={{ padding: "8px 0", textAlign: "right", color: "#059669" }}>{formatCurrency(totalPaid)}</td>
            </tr>
            <tr>
              <td style={{ padding: "12px 0", fontWeight: 700, color: "#1A1635" }}>Balance due</td>
              <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 700, color: "#4F46E5", fontSize: "1.125rem" }}>
                {formatCurrency(balance < 0 ? 0 : balance)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment history */}
        {invoice.payments.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B6B8A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Payment history
            </p>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2DFF5" }}>
                  <th style={{ textAlign: "left", padding: "6px 0", color: "#6B6B8A", fontWeight: 500 }}>Date</th>
                  <th style={{ textAlign: "left", padding: "6px 0", color: "#6B6B8A", fontWeight: 500 }}>Method</th>
                  <th style={{ textAlign: "right", padding: "6px 0", color: "#6B6B8A", fontWeight: 500 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(226,223,245,0.5)" }}>
                    <td style={{ padding: "6px 0" }}>{formatDate(p.paidOn)}</td>
                    <td style={{ padding: "6px 0", textTransform: "capitalize" }}>{p.method ?? "—"}</td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #E2DFF5", paddingTop: "1rem", textAlign: "center", fontSize: "0.75rem", color: "#6B6B8A" }}>
          <p style={{ margin: "0 0 4px" }}>This is a computer-generated receipt and does not require a signature.</p>
          <p style={{ margin: 0 }}>{org.name} · Generated on {formatDate(new Date())}</p>
        </div>
      </div>
    </>
  );
}
