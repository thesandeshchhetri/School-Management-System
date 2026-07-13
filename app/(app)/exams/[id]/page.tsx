import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, EmptyState, FormSelect } from "@/components/ui";
import { saveGrades } from "@/lib/actions/exams";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";

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
  type GradeEntry = { studentId: string; marksObtained: number };
  const gradeMap = new Map<string, GradeEntry>(
    (existingGrades as GradeEntry[]).map((g) => [g.studentId, g])
  );

  const saveWithId = saveGrades.bind(null, id);

  return (
    <div>
      <PageHeader title={exam.name} description={`${exam.classRoom.name} · Max marks ${exam.maxMarks}`} />

      {subjects.length === 0 ? (
        <EmptyState title="No subjects available" description="Assign yourself to a subject for this class first." />
      ) : (
        <>
          <Card className="p-4 mb-6">
            <form method="get" className="flex items-end gap-4" aria-label="Choose subject to grade">
              <FormSelect label="Subject" name="subjectId" defaultValue={subjectId}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </FormSelect>
              <Button type="submit" variant="ghost">
                Load
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden">
            <form action={saveWithId} aria-label="Enter marks for students">
              <input type="hidden" name="subjectId" value={subjectId} />
              <table className="w-full text-sm">
                <caption className="sr-only">Marks entry for {exam.name}</caption>
                <thead>
                  <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                    <th scope="col" className="px-5 py-3 font-medium">Student</th>
                    <th scope="col" className="px-5 py-3 font-medium">Marks (/{exam.maxMarks})</th>
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
                        <label htmlFor={`marks-${s.id}`} className="sr-only">
                          Marks for {s.firstName} {s.lastName}
                        </label>
                        <input
                          id={`marks-${s.id}`}
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
                  <SubmitButton>Save marks</SubmitButton>
                </div>
              )}
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
