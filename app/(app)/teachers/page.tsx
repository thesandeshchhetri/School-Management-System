import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, LinkButton, Badge, EmptyState } from "@/components/ui";
import { Plus, Pencil } from "lucide-react";
import Link from "next/link";
import DeleteButton from "./delete-button";
import { ExportCSVLink } from "@/components/csv-export-link";
import { ImportCSVButton } from "@/components/csv-import-button";

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

      <Card className="overflow-hidden">
        {teachers.length === 0 ? (
          <EmptyState title="No teachers yet" description="Add your first teacher to get started." />
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="sm:hidden divide-y divide-border">
              {teachers.map((t) => (
                <li key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{t.user.name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {t.subject ?? "—"} · {t.classesAsTeacher.length} classes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/teachers/${t.id}`} aria-label={`Edit ${t.user.name}`}
                      className="p-2 rounded-lg bg-background text-ink-soft">
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <DeleteButton id={t.id} name={t.user.name} />
                  </div>
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <caption className="sr-only">List of teaching staff</caption>
              <thead>
                <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                  <th scope="col" className="px-5 py-3 font-medium">Name</th>
                  <th scope="col" className="px-5 py-3 font-medium">Email</th>
                  <th scope="col" className="px-5 py-3 font-medium">Subject</th>
                  <th scope="col" className="px-5 py-3 font-medium">Classes</th>
                  <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>
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
                        <Link href={`/teachers/${t.id}`} aria-label={`Edit ${t.user.name}`}
                          className="p-1.5 rounded-md hover:bg-border text-ink-soft">
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                        <DeleteButton id={t.id} name={t.user.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </div>
  );
}
