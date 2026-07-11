"use client";

import { Trash2 } from "lucide-react";
import { deleteTimetableSlot } from "@/lib/actions/timetable";
import { useTransition } from "react";

export default function SlotDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50"
      disabled={pending}
      onClick={() => startTransition(() => deleteTimetableSlot(id))}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
