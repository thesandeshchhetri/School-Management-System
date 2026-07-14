import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { AdminPasswordResetCard } from "@/components/admin-password-reset-card";
import { notFound } from "next/navigation";
import TeacherEditForm from "./teacher-edit-form";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
  if (!teacher) notFound();

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title={`Edit ${teacher.user.name}`} />

      <TeacherEditForm
        id={id}
        teacher={{
          name:    teacher.user.name,
          email:   teacher.user.email,
          subject: teacher.subject ?? "",
          phone:   teacher.phone ?? "",
        }}
      />

      <AdminPasswordResetCard userId={teacher.user.id} userName={teacher.user.name} />
    </div>
  );
}
