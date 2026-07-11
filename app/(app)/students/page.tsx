import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, LinkButton, Badge, EmptyState } from "@/components/ui";
import { Plus, Pencil } from "lucide-react";
import Link from "next/link";
import DeleteButton from "./delete-button";

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
          user.role === "ADMIN" && (
            <LinkButton href="/students/new">
              <Plus className="w-4 h-4" /> Add student
            </LinkButton>
          )
        }
      />

      <Card className="overflow-hidden">
        {students.length === 0 ? (
          <EmptyState
            title="No students yet"
            description="Add your first student to get started."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Admission No.</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                {user.role === "ADMIN" && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-background/60">
                  <td className="px-5 py-3 font-medium">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{s.admissionNo}</td>
                  <td className="px-5 py-3">
                    {s.classRoom ? (
                      <Badge tone="neutral">{s.classRoom.name}</Badge>
                    ) : (
                      <span className="text-ink-soft text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{s.gender ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-soft">{s.phone ?? "—"}</td>
                  {user.role === "ADMIN" && (
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/students/${s.id}`}
                          className="p-1.5 rounded-md hover:bg-border text-ink-soft"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <DeleteButton id={s.id} name={`${s.firstName} ${s.lastName}`} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
