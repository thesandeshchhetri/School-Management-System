import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, LinkButton, Badge, EmptyState } from "@/components/ui";
import { Plus, Pencil, FileText } from "lucide-react";
import Link from "next/link";
import DeleteButton from "./delete-button";
import { ExportCSVLink } from "@/components/csv-export-link";
import { ImportCSVButton } from "@/components/csv-import-button";

export default async function StudentsPage() {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const students = await prisma.student.findMany({
    orderBy: { enrolledOn: "desc" },
    include: { classRoom: true },
  });

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
                  templateHint='Columns: Admission No, First Name, Last Name, Class, Gender, Date of Birth, Phone, Address'
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

      <Card className="overflow-hidden">
        {students.length === 0 ? (
          <EmptyState
            title="No students yet"
            description="Add your first student to get started."
          />
        ) : (
          <>
            {/* Mobile card list */}
            <ul className="sm:hidden divide-y divide-border">
              {students.map((s) => (
                <li key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {s.admissionNo} · {s.classRoom?.name ?? "Unassigned"}
                    </p>
                  </div>
                  {user.role === "ADMIN" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/students/${s.id}/report-card`} aria-label={`Report card for ${s.firstName} ${s.lastName}`}
                        className="p-2 rounded-lg bg-background text-ink-soft">
                        <FileText className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <Link href={`/students/${s.id}`} aria-label={`Edit ${s.firstName} ${s.lastName}`}
                        className="p-2 rounded-lg bg-background text-ink-soft">
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <DeleteButton id={s.id} name={`${s.firstName} ${s.lastName}`} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <caption className="sr-only">List of enrolled students</caption>
              <thead>
                <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                  <th scope="col" className="px-5 py-3 font-medium">Name</th>
                  <th scope="col" className="px-5 py-3 font-medium">Admission No.</th>
                  <th scope="col" className="px-5 py-3 font-medium">Class</th>
                  <th scope="col" className="px-5 py-3 font-medium">Gender</th>
                  <th scope="col" className="px-5 py-3 font-medium">Phone</th>
                  {user.role === "ADMIN" && <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-background/60">
                    <td className="px-5 py-3 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="px-5 py-3 text-ink-soft">{s.admissionNo}</td>
                    <td className="px-5 py-3">
                      {s.classRoom ? <Badge tone="neutral">{s.classRoom.name}</Badge> : <span className="text-ink-soft text-xs">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{s.gender ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-soft">{s.phone ?? "—"}</td>
                    {user.role === "ADMIN" && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/students/${s.id}/report-card`} aria-label={`Report card for ${s.firstName} ${s.lastName}`}
                            className="p-1.5 rounded-md hover:bg-border text-ink-soft">
                            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                          <Link href={`/students/${s.id}`} aria-label={`Edit ${s.firstName} ${s.lastName}`}
                            className="p-1.5 rounded-md hover:bg-border text-ink-soft">
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                          <DeleteButton id={s.id} name={`${s.firstName} ${s.lastName}`} />
                        </div>
                      </td>
                    )}
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
