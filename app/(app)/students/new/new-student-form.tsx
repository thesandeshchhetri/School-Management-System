"use client";

import { useActionState } from "react";
import { createStudent } from "@/lib/actions/students";
import { Card, FormField, FormSelect } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { AlertTriangle } from "lucide-react";

export default function NewStudentForm({
  classRooms,
}: {
  classRooms: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(createStudent, undefined);

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="First name" name="firstName" required />
          <FormField label="Last name" name="lastName" required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Admission number" name="admissionNo" required />
          <FormSelect label="Class" name="classRoomId">
            <option value="">Unassigned</option>
            {classRooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FormSelect>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormSelect label="Gender" name="gender">
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </FormSelect>
          <FormField label="Date of birth" name="dateOfBirth" type="date" />
        </div>
        <FormField label="Phone" name="phone" />

        <div className="border-t border-border pt-5">
          <label className="flex items-center gap-2.5 text-sm font-medium mb-4 cursor-pointer" htmlFor="createLogin">
            <input type="checkbox" id="createLogin" name="createLogin" className="rounded" />
            Create a student portal login
          </label>
          <FormField
            label="Login email (required if creating login)"
            name="email"
            type="email"
            placeholder="student@school.edu"
            hint="Default password will be student123 — student should change it after first sign-in. Email must be unique."
          />
        </div>

        {state?.error && (
          <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {state.error}
          </p>
        )}

        <SubmitButton>Save student</SubmitButton>
      </form>
    </Card>
  );
}
