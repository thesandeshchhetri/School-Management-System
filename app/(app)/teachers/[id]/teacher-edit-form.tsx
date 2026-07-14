"use client";

import { useActionState } from "react";
import { updateTeacher } from "@/lib/actions/teachers";
import { Card, FormField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

type Props = {
  id: string;
  teacher: { name: string; email: string; subject: string; phone: string };
};

export default function TeacherEditForm({ id, teacher }: Props) {
  const boundAction = updateTeacher.bind(null, id);
  const [state, formAction] = useActionState(boundAction, undefined);

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-5">
        <FormField label="Full name" name="name" defaultValue={teacher.name} required />
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Primary subject" name="subject" defaultValue={teacher.subject} />
          <FormField label="Phone" name="phone" defaultValue={teacher.phone} />
        </div>
        <div className="border-t border-border pt-5">
          <FormField
            label="Login email"
            name="email"
            type="email"
            defaultValue={teacher.email}
            hint="Changing this updates the email they use to sign in. Must be unique."
          />
        </div>

        {state?.ok && (
          <p className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3" role="status">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            Changes saved successfully.
          </p>
        )}
        {state?.error && (
          <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {state.error}
          </p>
        )}

        <SubmitButton>Save changes</SubmitButton>
      </form>
    </Card>
  );
}
