"use client";

import { Trash2 } from "lucide-react";
import { deleteClassRoom } from "@/lib/actions/academics";
import { useTransition } from "react";

export default function ClassDeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50"
      disabled={pending}
      aria-label={`Delete class ${name}`}
      onClick={() => {
        if (confirm(`Delete ${name}? Students will become unassigned.`)) {
          startTransition(() => deleteClassRoom(id));
        }
      }}
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}
