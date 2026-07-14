import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import NewStudentForm from "./new-student-form";

export default async function NewStudentPage() {
  await requireRole(["ADMIN"]);
  const classRooms = await prisma.classRoom.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add student" description="Enrol a new student into the register." />
      <NewStudentForm classRooms={classRooms.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
