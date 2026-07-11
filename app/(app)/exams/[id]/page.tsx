import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";
import { saveGrades } from "@/lib/actions/exams";
import { notFound } from "next/navigation";

export default async function ExamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subjectId?: string }>;
}) {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const { id } = await params;
  const { subjectId: subjectIdParam } = await searchParams;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      classRoom: {
        include: {
          subjects: {
            include: { teachers: { include: { teacher: true } } },
          },
          students: { orderBy: { firstName: "asc" } },
        },
      },
    },
  });

  if (!exam) notFound();

  const subjects =
    user.role === "ADMIN"
      ? exam.classRoom.subjects
      : exam.classRoom.subjects.filter((s) =>
          s.teachers.some((t) => t.teacher.userId === user.id)
        );

  const subjectId = subjectIdParam ?? subjects[0]?.id;

  const existingGrades = subjectId
    ? await prisma.gradeEntry.findMany({ where: { examId: id, subjectId } })
    : [];
  const gradeMap = new Map(existingGrades.map((g) => [g.studentId, g]));

  const saveWithId = saveGrades.bind(null, id);

  return (
    <div>
      <PageHeader title={exam.name} description={`${exam.classRoom.name} · Max marks ${exam.maxMarks}`} />

      {subjects.length === 0 ? (
        <EmptyState title="No subjects available" description="Assign yourself to a subject for this class first." />
      ) : (
        <>
          <Card className="p-4 mb-6">
            <form method="get" className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject</label>
                <select name="subjectId" defaultValue={subjectId} className="input min-w-[220px]">
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="ghost">
                Load
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden">
            <form action={saveWithId}>
              <input type="hidden" name="subjectId" value={subjectId} />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">Marks (/{exam.maxMarks})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exam.classRoom.students.map((s) => (
                    <tr key={s.id}>
                      <td className="px-5 py-3 font-medium">
                        {s.firstName} {s.lastName}
                        <input type="hidden" name="studentId" value={s.id} />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          max={exam.maxMarks}
                          name={`marks-${s.id}`}
                          defaultValue={gradeMap.get(s.id)?.marksObtained ?? ""}
                          className="input max-w-[120px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {exam.classRoom.students.length === 0 ? (
                <EmptyState title="No students in this class" />
              ) : (
                <div className="px-5 py-4 border-t border-border">
                  <Button type="submit">Save marks</Button>
                </div>
              )}
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
