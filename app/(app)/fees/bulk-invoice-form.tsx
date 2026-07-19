"use client";

import { useActionState, useEffect } from "react";
import { bulkCreateInvoice, markOverdueInvoices } from "@/lib/actions/fees";
import { FormField, FormSelect } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CheckCircle2, AlertTriangle, Users, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ClassRoom = { id: string; name: string; studentCount: number };

export function BulkInvoiceForm({ classRooms }: { classRooms: ClassRoom[] }) {
  const router = useRouter();
  const [state, formAction] = useActionState(bulkCreateInvoice, undefined);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-primary" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink">Bulk invoice — entire class</p>
      </div>
      <form action={formAction} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <FormSelect label="Class" name="classRoomId" required>
            <option value="">Select class…</option>
            {classRooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.studentCount} students)
              </option>
            ))}
          </FormSelect>
          <FormField label="Invoice title" name="title" required placeholder="Term 2 Tuition" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <FormField label="Amount per student" name="amount" type="number" step="0.01" required />
          <FormField label="Due date" name="dueDate" type="date" required />
        </div>

        {state?.ok && (
          <p className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3" role="status">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            Created {state.created} invoice{state.created !== 1 ? "s" : ""} (skipped duplicates).
          </p>
        )}
        {state?.error && (
          <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {state.error}
          </p>
        )}

        <SubmitButton variant="ghost">
          <Users className="w-4 h-4" aria-hidden="true" />
          Create for whole class
        </SubmitButton>
      </form>
    </div>
  );
}

export function MarkOverdueButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markOverdueInvoices();
          router.refresh();
          if (result.updated > 0) {
            alert(`Marked ${result.updated} invoice${result.updated !== 1 ? "s" : ""} as overdue.`);
          } else {
            alert("No invoices need marking — all past-due ones are already overdue.");
          }
        })
      }
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-white/70 hover:bg-white border border-border text-ink shadow-sm transition-colors disabled:opacity-50"
      aria-label="Mark past-due invoices as overdue"
    >
      <Clock className="w-4 h-4 text-warn" aria-hidden="true" />
      {pending ? "Updating…" : "Mark overdue"}
    </button>
  );
}
