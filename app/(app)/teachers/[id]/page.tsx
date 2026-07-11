import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button } from "@/components/ui";
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
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Full name</label>
            <input type="text" name="name" defaultValue={teacher.user.name} required className="input" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Primary subject</label>
              <input type="text" name="subject" defaultValue={teacher.subject ?? ""} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Phone</label>
              <input type="text" name="phone" defaultValue={teacher.phone ?? ""} className="input" />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
