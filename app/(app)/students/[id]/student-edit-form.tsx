"use client";

import { useActionState } from "react";
import { updateStudent } from "@/lib/actions/students";
import { Card, FormField, FormSelect } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CheckCircle2, AlertTriangle, UserPlus, KeyRound } from "lucide-react";

type Props = {
  id: string;
  student: {
    firstName: string;
    lastName: string;
    admissionNo: string;
    classRoomId: string;
    gender: string;
    phone: string;
    dateOfBirth: string;
    email: string;
    hasLogin: boolean;
  };
  classRooms: { id: string; name: string }[];
};

export default function StudentEditForm({ id, student, classRooms }: Props) {
  const boundAction = updateStudent.bind(null, id);
  const [state, formAction] = useActionState(boundAction, undefined);

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="First name" name="firstName" defaultValue={student.firstName} required />
          <FormField label="Last name"  name="lastName"  defaultValue={student.lastName}  required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Admission number" name="admissionNo" defaultValue={student.admissionNo} required />
          <FormSelect label="Class" name="classRoomId" defaultValue={student.classRoomId}>
            <option value="">Unassigned</option>
            {classRooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FormSelect>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormSelect label="Gender" name="gender" defaultValue={student.gender}>
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </FormSelect>
          <FormField label="Date of birth" name="dateOfBirth" type="date" defaultValue={student.dateOfBirth} />
        </div>
        <FormField label="Phone" name="phone" defaultValue={student.phone} />

        {/* Portal login section */}
        <div className="border-t border-border pt-5">
          {student.hasLogin ? (
            /* Has login — allow email change */
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
                  <KeyRound className="w-3 h-3" aria-hidden="true" />
                  Portal login active
                </span>
              </div>
              <FormField
                label="Login email"
                name="email"
                type="email"
                defaultValue={student.email}
                hint="Changing this updates the email they use to sign in. Must be unique."
              />
            </div>
          ) : (
            /* No login — offer to create one */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
                  <UserPlus className="w-3 h-3" aria-hidden="true" />
                  No portal login
                </span>
              </div>
              <FormField
                label="Create portal login — enter email address"
                name="email"
                type="email"
                placeholder="student@school.edu"
                hint="Leave blank to keep no portal login. If you add an email, a login will be created with the default password student123."
              />
            </div>
          )}
        </div>

        {/* Feedback */}
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
