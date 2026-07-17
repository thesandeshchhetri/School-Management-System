import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton } from "@/components/ui";
import { Plus } from "lucide-react";
import { ExportCSVLink } from "@/components/csv-export-link";
import { ImportCSVButton } from "@/components/csv-import-button";
import StudentsList from "./students-list";

export default async function StudentsPage() {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const [students, classRooms] = await Promise.all([
    prisma.student.findMany({
      orderBy: { firstName: "asc" },
      include: { classRoom: true },
    }),
    prisma.classRoom.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${students.length} students enrolled`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportCSVLink href="/api/export/students" label="Export CSV" />
            {user.role === "ADMIN" && (
              <>
                <ImportCSVButton
                  action="/api/import/students"
                  templateHint="Columns: Admission No, First Name, Last Name, Class, Gender, Date of Birth, Phone, Address"
                  templateUrl="/api/templates/students"
                />
                <LinkButton href="/students/new">
                  <Plus className="w-4 h-4" aria-hidden="true" /> Add student
                </LinkButton>
              </>
            )}
          </div>
        }
      />

      <StudentsList
        students={students.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          admissionNo: s.admissionNo,
          gender: s.gender,
          phone: s.phone,
          classRoom: s.classRoom ? { id: s.classRoom.id, name: s.classRoom.name } : null,
        }))}
        classRooms={classRooms}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}
