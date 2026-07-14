import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/ui";
import { FileText } from "lucide-react";
import { AdminPasswordResetCard } from "@/components/admin-password-reset-card";
import StudentEditForm from "./student-edit-form";

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

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-sm text-ink-soft mt-1">{student.admissionNo}</p>
        </div>
        <LinkButton href={`/students/${id}/report-card`} variant="ghost">
          <FileText className="w-4 h-4" aria-hidden="true" /> Report card
        </LinkButton>
      </div>

      {/* Client form handles inline success/error via useActionState */}
      <StudentEditForm
        id={id}
        student={{
          firstName:   student.firstName,
          lastName:    student.lastName,
          admissionNo: student.admissionNo,
          classRoomId: student.classRoomId ?? "",
          gender:      student.gender ?? "",
          phone:       student.phone ?? "",
          dateOfBirth: student.dateOfBirth?.toISOString().slice(0, 10) ?? "",
          email:       student.user?.email ?? "",
          hasLogin:    !!student.user,
        }}
        classRooms={classRooms.map((c) => ({ id: c.id, name: c.name }))}
      />

      {/* Password reset — only if student has a login */}
      {student.user && (
        <AdminPasswordResetCard
          userId={student.user.id}
          userName={`${student.firstName} ${student.lastName}`}
        />
      )}
    </div>
  );
}
