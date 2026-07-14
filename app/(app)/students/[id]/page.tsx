import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, FormField, FormSelect, LinkButton } from "@/components/ui";
import { updateStudent } from "@/lib/actions/students";
import { AdminPasswordResetCard } from "@/components/admin-password-reset-card";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { FileText } from "lucide-react";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;

  const [student, classRooms] = await Promise.all([
    prisma.student.findUnique({ where: { id }, include: { user: true } }),
    prisma.classRoom.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!student) notFound();

  const updateWithId = updateStudent.bind(null, id);

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title={`Edit ${student.firstName} ${student.lastName}`}
        action={
          <LinkButton href={`/students/${id}/report-card`} variant="ghost">
            <FileText className="w-4 h-4" aria-hidden="true" /> Report card
          </LinkButton>
        }
      />

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
                <option key={c.id} value={c.id}>{c.name}</option>
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

          {/* Email — only shown if student has a portal login */}
          {student.user && (
            <div className="border-t border-border pt-5">
              <FormField
                label="Portal login email"
                name="email"
                type="email"
                defaultValue={student.user.email}
                hint="Changing this updates the email they use to sign in."
              />
            </div>
          )}

          <SubmitButton>Save changes</SubmitButton>
        </form>
      </Card>

      {/* Password reset — only shown if student has a portal login */}
      {student.user && (
        <AdminPasswordResetCard
          userId={student.user.id}
          userName={`${student.firstName} ${student.lastName}`}
        />
      )}

      {!student.user && (
        <Card className="p-5">
          <p className="text-sm text-ink-soft">
            This student doesn&apos;t have a portal login yet. To create one, delete and re-add the
            student with the &ldquo;Create a student portal login&rdquo; option checked.
          </p>
        </Card>
      )}
    </div>
  );
}
