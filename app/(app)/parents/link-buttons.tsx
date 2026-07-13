"use client";

import { useTransition } from "react";
import { linkChild, unlinkChild, deleteParent } from "@/lib/actions/parents";
import { Trash2, UserMinus } from "lucide-react";

export function LinkChildButton({
  parentId,
  studentId,
  studentName,
}: {
  parentId: string;
  studentId: string;
  studentName: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-soft disabled:opacity-50 transition-colors"
      onClick={() => startTransition(() => linkChild(parentId, studentId))}
    >
      {pending ? "Linking…" : `Link ${studentName}`}
    </button>
  );
}

export function UnlinkChildButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      aria-label={`Unlink ${studentName}`}
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50 transition-colors"
      onClick={() => {
        if (confirm(`Unlink ${studentName} from this parent?`)) {
          startTransition(() => unlinkChild(studentId));
        }
      }}
    >
      <UserMinus className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}

export function DeleteParentButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      aria-label={`Delete parent ${name}`}
      className="p-1.5 rounded-md hover:bg-danger-soft text-ink-soft hover:text-danger disabled:opacity-50 transition-colors"
      onClick={() => {
        if (confirm(`Delete ${name}'s parent account? Their children will be unlinked but not deleted.`)) {
          startTransition(() => deleteParent(id));
        }
      }}
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}
