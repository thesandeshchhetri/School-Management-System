"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { clearClassTimetable } from "@/lib/actions/timetable";

export default function ClearTimetableButton({
  classRoomId,
  className,
}: {
  classRoomId: string;
  className: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Clear ALL timetable slots for ${className}? This cannot be undone.`)) {
          startTransition(() => clearClassTimetable(classRoomId));
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-danger bg-danger-soft hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
      aria-label={`Clear all timetable slots for ${className}`}
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
      {pending ? "Clearing…" : "Clear all slots"}
    </button>
  );
}
