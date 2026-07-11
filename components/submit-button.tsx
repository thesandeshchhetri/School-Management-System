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
    primary: "bg-primary text-white hover:bg-primary-soft",
    secondary: "bg-accent text-white hover:opacity-90",
    danger: "bg-danger text-white hover:opacity-90",
    ghost: "bg-transparent text-ink-soft hover:bg-border/50 border border-border",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantMap[variant],
        className
      )}
    >
      {pending ? pendingText ?? "Saving…" : children}
    </button>
  );
}
