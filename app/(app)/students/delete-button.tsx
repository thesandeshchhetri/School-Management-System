"use client";

import { Trash2 } from "lucide-react";
import { deleteStudent } from "@/lib/actions/students";
import { useTransition } from "react";

export default function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        if (confirm(`Remove ${name} from the school register? This can't be undone.`)) {
          startTransition(() => {
            deleteStudent(id);
          });
        }
      }}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
