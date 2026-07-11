"use client";

import { Trash2 } from "lucide-react";
import { deleteExam } from "@/lib/actions/exams";
import { useTransition } from "react";

export default function ExamDeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        if (confirm(`Delete exam ${name}? All recorded marks will be lost.`)) {
          startTransition(() => deleteExam(id));
        }
      }}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
