"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Drop-in replacement for <Button type="submit"> inside a <form action={...}>.
 * Uses useFormStatus to detect when the form is submitting and disables
 * itself immediately, preventing accidental double-clicks from creating
 * duplicate records (e.g. two payments, two attendance rows).
 */
export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();

  const variantMap = {
    primary: "btn-gradient text-white font-semibold",
    secondary: "bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-sm transition-colors",
    danger: "bg-danger hover:opacity-90 text-white font-semibold shadow-sm transition-colors",
    ghost: "bg-white/70 hover:bg-white text-ink border border-border font-medium transition-colors shadow-sm",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variantMap[variant],
        className
      )}
    >
      {pending ? pendingText ?? "Saving…" : children}
    </button>
  );
}
