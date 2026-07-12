"use client";

import { Trash2 } from "lucide-react";
import { deleteAdminUser } from "@/lib/actions/superadmin";
import { useTransition } from "react";

export default function DeleteAdminButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      aria-label={`Remove admin ${name}`}
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50"
      onClick={() => {
        if (confirm(`Remove admin access for ${name}? This permanently deletes their account.`)) {
          startTransition(() => deleteAdminUser(id));
        }
      }}
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}
