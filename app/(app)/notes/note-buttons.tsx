"use client";

import { Trash2, Pin, PinOff } from "lucide-react";
import { deleteNote, togglePin } from "@/lib/actions/notes";
import { useTransition } from "react";

export function DeleteNoteButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      aria-label={`Delete note: ${title}`}
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50 transition-colors"
      onClick={() => {
        if (confirm(`Delete "${title}"?`)) {
          startTransition(() => deleteNote(id));
        }
      }}
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}

export function PinNoteButton({ id, pinned }: { id: string; pinned: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      aria-label={pinned ? "Unpin note" : "Pin note to top"}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
        pinned
          ? "text-accent hover:bg-accent-soft"
          : "text-ink-soft hover:bg-border"
      }`}
      onClick={() => startTransition(() => togglePin(id))}
    >
      {pinned ? (
        <PinOff className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <Pin className="w-3.5 h-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
