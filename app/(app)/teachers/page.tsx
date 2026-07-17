import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton } from "@/components/ui";
import { Plus } from "lucide-react";
import { ExportCSVLink } from "@/components/csv-export-link";
import { ImportCSVButton } from "@/components/csv-import-button";
import TeachersList from "./teachers-list";

export default async function TeachersPage() {
  await requireRole(["ADMIN"]);

  const teachers = await prisma.teacher.findMany({
    orderBy: { user: { name: "asc" } },
    include: { user: true, classesAsTeacher: true },
  });

  return (
    <div>
      <PageHeader
        title="Teachers"
        description={`${teachers.length} staff members`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportCSVLink href="/api/export/teachers" label="Export CSV" />
            <ImportCSVButton
              action="/api/import/teachers"
              templateHint="Columns: Name, Email, Subject, Phone"
              templateUrl="/api/templates/teachers"
            />
            <LinkButton href="/teachers/new">
              <Plus className="w-4 h-4" aria-hidden="true" /> Add teacher
            </LinkButton>
          </div>
        }
      />
      <TeachersList
        teachers={teachers.map((t) => ({
          id: t.id,
          subject: t.subject,
          phone: t.phone,
          user: { name: t.user.name, email: t.user.email },
          classesAsTeacher: t.classesAsTeacher.map((c) => ({ id: c.id })),
        }))}
      />
    </div>
  );
}
