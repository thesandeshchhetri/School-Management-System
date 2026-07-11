import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, LinkButton, Badge, EmptyState } from "@/components/ui";
import { Plus, Pencil } from "lucide-react";
import Link from "next/link";
import DeleteButton from "./delete-button";

export default async function TeachersPage() {
  await requireRole(["ADMIN"]);

  const teachers = await prisma.teacher.findMany({
    orderBy: { joinedOn: "desc" },
    include: { user: true, classesAsTeacher: true },
  });

  return (
    <div>
      <PageHeader
        title="Teachers"
        description={`${teachers.length} staff members`}
        action={
          <LinkButton href="/teachers/new">
            <Plus className="w-4 h-4" /> Add teacher
          </LinkButton>
        }
      />

      <Card className="overflow-hidden">
        {teachers.length === 0 ? (
          <EmptyState title="No teachers yet" description="Add your first teacher to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Classes</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-background/60">
                  <td className="px-5 py-3 font-medium">{t.user.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{t.user.email}</td>
                  <td className="px-5 py-3 text-ink-soft">{t.subject ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone="neutral">{t.classesAsTeacher.length} classes</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/teachers/${t.id}`} className="p-1.5 rounded-md hover:bg-border text-ink-soft">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <DeleteButton id={t.id} name={t.user.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
