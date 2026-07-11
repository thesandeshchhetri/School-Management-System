import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, FormField, FormSelect } from "@/components/ui";
import { updateStudent } from "@/lib/actions/students";
import { notFound } from "next/navigation";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;

  const [student, classRooms] = await Promise.all([
    prisma.student.findUnique({ where: { id } }),
    prisma.classRoom.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!student) notFound();

  const updateWithId = updateStudent.bind(null, id);

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${student.firstName} ${student.lastName}`} />
      <Card className="p-6">
        <form action={updateWithId} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="First name" name="firstName" defaultValue={student.firstName} required />
            <FormField label="Last name" name="lastName" defaultValue={student.lastName} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Admission number" name="admissionNo" defaultValue={student.admissionNo} required />
            <FormSelect label="Class" name="classRoomId" defaultValue={student.classRoomId ?? ""}>
              <option value="">Unassigned</option>
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormSelect label="Gender" name="gender" defaultValue={student.gender ?? ""}>
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </FormSelect>
            <FormField
              label="Date of birth"
              name="dateOfBirth"
              type="date"
              defaultValue={student.dateOfBirth?.toISOString().slice(0, 10)}
            />
          </div>
          <FormField label="Phone" name="phone" defaultValue={student.phone ?? ""} />

          <div className="flex gap-3 pt-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
