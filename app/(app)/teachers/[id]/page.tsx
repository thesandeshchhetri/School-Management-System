import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, FormField } from "@/components/ui";
import { updateTeacher } from "@/lib/actions/teachers";
import { notFound } from "next/navigation";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
  if (!teacher) notFound();

  const updateWithId = updateTeacher.bind(null, id);

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${teacher.user.name}`} />
      <Card className="p-6">
        <form action={updateWithId} className="space-y-5">
          <FormField label="Full name" name="name" defaultValue={teacher.user.name} required />
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Primary subject" name="subject" defaultValue={teacher.subject ?? ""} />
            <FormField label="Phone" name="phone" defaultValue={teacher.phone ?? ""} />
          </div>
          <div className="pt-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
