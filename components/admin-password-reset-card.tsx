"use client";

import { useActionState } from "react";
import { Card, FormField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { adminResetPassword } from "@/lib/actions/reset-password";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

export function AdminPasswordResetCard({ userId, userName }: { userId: string; userName: string }) {
  const boundAction = adminResetPassword.bind(null, userId);
  const [state, formAction] = useActionState(boundAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <Card className="p-5">
      <h2 className="font-display font-semibold text-primary mb-1">Reset password</h2>
      <p className="text-sm text-ink-soft mb-4">
        Set a new password for <strong>{userName}</strong>. They should change it after signing in.
      </p>
      <form ref={formRef} action={formAction} className="space-y-3">
        <FormField
          label="New password"
          name="password"
          type="text"
          required
          hint="Minimum 6 characters."
          placeholder="e.g. Welcome@2026"
        />
        {state?.ok && (
          <p className="flex items-center gap-2 text-sm text-success bg-success-soft rounded-lg px-3.5 py-2.5" role="status">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            Password reset successfully!
          </p>
        )}
        {state?.error && (
          <p className="flex items-center gap-2 text-sm text-danger bg-danger-soft rounded-lg px-3.5 py-2.5" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {state.error}
          </p>
        )}
        <SubmitButton variant="ghost">Reset password</SubmitButton>
      </form>
    </Card>
  );
}
