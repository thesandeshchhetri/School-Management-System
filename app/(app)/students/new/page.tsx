import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, FormField, FormSelect } from "@/components/ui";
import { createStudent } from "@/lib/actions/students";
import { SubmitButton } from "@/components/submit-button";

export default async function NewStudentPage() {
  await requireRole(["ADMIN"]);
  const classRooms = await prisma.classRoom.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add student" description="Enrol a new student into the register." />
      <Card className="p-6">
        <form action={createStudent} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="First name" name="firstName" required />
            <FormField label="Last name" name="lastName" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Admission number" name="admissionNo" required />
            <FormSelect label="Class" name="classRoomId">
              <option value="">Unassigned</option>
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
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
            <label className="flex items-center gap-2 text-sm mb-3" htmlFor="createLogin">
              <input type="checkbox" id="createLogin" name="createLogin" className="rounded" />
              Create a student portal login
            </label>
            <FormField
              label="Login email (if creating a login)"
              name="email"
              type="email"
              hint="Default password will be student123 — the student should change it after first sign-in."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton>Save student</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
