"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { Badge, Card, EmptyState, Button, FormField, FormSelect } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import InvoiceDeleteButton from "./delete-button";
import ListFilterBar from "@/components/list-filter-bar";
import { recordPayment } from "@/lib/actions/fees";
import { formatCurrency, formatDate } from "@/lib/utils";

type Invoice = {
  id: string;
  title: string;
  amount: number;
  dueDate: Date;
  status: "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE";
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  payments: { amount: number }[];
};

const STATUS_TONE = {
  PAID: "success", PARTIAL: "warn", UNPAID: "neutral", OVERDUE: "danger",
} as const;

export default function FeesList({ invoices }: { invoices: Invoice[] }) {
  const statusOptions = [
    { value: "UNPAID",  label: "Unpaid" },
    { value: "PARTIAL", label: "Partial" },
    { value: "OVERDUE", label: "Overdue" },
    { value: "PAID",    label: "Paid" },
  ];
  const sortOptions = [
    { value: "due-asc",    label: "Due date ↑" },
    { value: "due-desc",   label: "Due date ↓" },
    { value: "name",       label: "Student name" },
    { value: "amount-desc", label: "Amount ↓" },
    { value: "status",     label: "Status" },
  ];

  return (
    <ListFilterBar
      searchPlaceholder="Search student, invoice…"
      filterLabel="Status"
      filterOptions={statusOptions}
      sortOptions={sortOptions}
      defaultSort="due-desc"
      totalCount={invoices.length}
    >
      {({ search, filter, sort }) => {
        let filtered = invoices.filter((inv) => {
          const q = search.toLowerCase();
          const matchesSearch =
            !q ||
            `${inv.student.firstName} ${inv.student.lastName}`.toLowerCase().includes(q) ||
            inv.student.admissionNo.toLowerCase().includes(q) ||
            inv.title.toLowerCase().includes(q);
          const matchesFilter = !filter || inv.status === filter;
          return matchesSearch && matchesFilter;
        });

        filtered = [...filtered].sort((a, b) => {
          switch (sort) {
            case "due-asc":    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            case "name":       return `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`);
            case "amount-desc": return b.amount - a.amount;
            case "status":     return a.status.localeCompare(b.status);
            default:           return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
          }
        });

        if (filtered.length === 0) {
          return (
            <Card>
              <EmptyState title="No invoices match" description="Try adjusting your search or filter." />
            </Card>
          );
        }

        return (
          <Card className="overflow-hidden">
            <div className="px-5 py-2.5 border-b border-border flex items-center justify-between">
              <span className="text-xs text-ink-soft">
                {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
                {filter || search ? " matched" : " total"}
              </span>
              <span className="text-xs text-ink-soft">
                Outstanding: {formatCurrency(
                  filtered
                    .filter((i) => i.status !== "PAID")
                    .reduce((s, i) => s + i.amount - i.payments.reduce((p, pay) => p + pay.amount, 0), 0)
                )}
              </span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((inv) => {
                const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                return (
                  <div key={inv.id} className="px-4 sm:px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {inv.student.firstName} {inv.student.lastName}
                          <span className="text-ink-soft font-normal ml-1.5">· {inv.title}</span>
                        </p>
                        <p className="text-xs text-ink-soft mt-0.5">
                          {inv.student.admissionNo} · {formatCurrency(paid)} of {formatCurrency(inv.amount)} paid · due {formatDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={STATUS_TONE[inv.status]}>{inv.status}</Badge>
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

                    {inv.status !== "PAID" && (
                      <form
                        action={recordPayment}
                        className="mt-3 flex flex-wrap items-center gap-2"
                        aria-label={`Record payment for ${inv.title}`}
                      >
                        <input type="hidden" name="invoiceId" value={inv.id} />
                        <input
                          type="number" step="0.01" name="amount"
                          placeholder="Amount" required
                          aria-label={`Amount for ${inv.title}`}
                          className="input w-32 flex-1 min-w-[100px]"
                        />
                        <select name="method" aria-label="Payment method" className="input flex-1 min-w-[120px]">
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
          </Card>
        );
      }}
    </ListFilterBar>
  );
}
