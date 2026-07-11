"use client";

import { Trash2 } from "lucide-react";
import { deleteInvoice } from "@/lib/actions/fees";
import { useTransition } from "react";

export default function InvoiceDeleteButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50"
      disabled={pending}
      aria-label={`Delete invoice ${label}`}
      onClick={() => {
        if (confirm(`Delete invoice "${label}"?`)) {
          startTransition(() => deleteInvoice(id));
        }
      }}
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}
