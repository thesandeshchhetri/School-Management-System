import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button } from "@/components/ui";
import { createStudent } from "@/lib/actions/students";

export default async function NewStudentPage() {
  await requireRole(["ADMIN"]);
  const classRooms = await prisma.classRoom.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add student" description="Enrol a new student into the register." />
      <Card className="p-6">
        <form action={createStudent} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First name" name="firstName" required />
            <Field label="Last name" name="lastName" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Admission number" name="admissionNo" required />
            <div>
              <Label>Class</Label>
              <select name="classRoomId" className="input">
                <option value="">Unassigned</option>
                {classRooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Gender</Label>
              <select name="gender" className="input">
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Field label="Date of birth" name="dateOfBirth" type="date" />
          </div>
          <Field label="Phone" name="phone" />

          <div className="border-t border-border pt-5">
            <label className="flex items-center gap-2 text-sm mb-3">
              <input type="checkbox" name="createLogin" className="rounded" />
              Create a student portal login
            </label>
            <Field label="Login email (if creating a login)" name="email" type="email" />
            <p className="text-xs text-ink-soft mt-1">
              Default password will be <code>student123</code> — the student should change it after first sign-in.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Save student</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-ink mb-1.5">{children}</label>;
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input type={type} name={name} required={required} className="input" />
    </div>
  );
}
