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
          subjects: { include: { teachers: { include: { teacher: true } } } },
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
  const currentSubject = subjects.find((s) => s.id === subjectId);

  const existingGrades = subjectId
    ? await prisma.gradeEntry.findMany({ where: { examId: id, subjectId } })
    : [];
  const gradeMap = new Map(existingGrades.map((g) => [g.studentId, g.marksObtained]));

  const saveWithId = saveGrades.bind(null, id);

  // Quick stats for already-entered marks
  const entered = existingGrades.length;
  const avg =
    entered > 0
      ? Math.round(existingGrades.reduce((s, g) => s + g.marksObtained, 0) / entered)
      : null;
  const highest = entered > 0 ? Math.max(...existingGrades.map((g) => g.marksObtained)) : null;

  return (
    <div>
      <PageHeader
        title={exam.name}
        description={`${exam.classRoom.name} · Max marks ${exam.maxMarks}`}
      />

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects available"
          description="Assign yourself to a subject for this class first."
        />
      ) : (
        <>
          {/* Subject selector */}
          <Card className="p-4 mb-4">
            <form method="get" className="flex flex-wrap items-end gap-4" aria-label="Choose subject to grade">
              <FormSelect label="Subject" name="subjectId" defaultValue={subjectId}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </FormSelect>
              <Button type="submit" variant="ghost">Load</Button>
            </form>
          </Card>

          {/* Stats bar */}
          {entered > 0 && avg !== null && highest !== null && (
            <div className="flex flex-wrap gap-4 mb-4 px-5 py-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-border text-sm">
              <div>
                <span className="text-ink-soft text-xs">Entered</span>
                <p className="font-semibold">{entered}/{exam.classRoom.students.length}</p>
              </div>
              <div>
                <span className="text-ink-soft text-xs">Average</span>
                <p className="font-semibold">{avg}/{exam.maxMarks}</p>
              </div>
              <div>
                <span className="text-ink-soft text-xs">Highest</span>
                <p className="font-semibold text-success">{highest}/{exam.maxMarks}</p>
              </div>
              <div>
                <span className="text-ink-soft text-xs">Subject</span>
                <p className="font-semibold">{currentSubject?.name ?? "—"}</p>
              </div>
            </div>
          )}

          <Card className="overflow-hidden">
            <form action={saveWithId} aria-label="Enter marks for students">
              <input type="hidden" name="subjectId" value={subjectId} />

              {/* Mobile: one card per student */}
              <ul className="sm:hidden divide-y divide-border">
                {exam.classRoom.students.map((s, i) => (
                  <li key={s.id} className="px-4 py-3">
                    <input type="hidden" name="studentId" value={s.id} />
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-ink-soft">#{i + 1}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label htmlFor={`m-marks-${s.id}`} className="sr-only">
                          Marks for {s.firstName} {s.lastName}
                        </label>
                        <input
                          id={`m-marks-${s.id}`}
                          type="number"
                          step="0.5"
                          min={0}
                          max={exam.maxMarks}
                          name={`marks-${s.id}`}
                          defaultValue={gradeMap.get(s.id) ?? ""}
                          placeholder="—"
                          className="input w-20 text-center text-base font-semibold"
                        />
                        <span className="text-xs text-ink-soft">/{exam.maxMarks}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <table className="hidden sm:table w-full text-sm">
                <caption className="sr-only">Marks entry for {exam.name}</caption>
                <thead>
                  <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                    <th scope="col" className="px-5 py-3 font-medium w-8">#</th>
                    <th scope="col" className="px-5 py-3 font-medium">Student</th>
                    <th scope="col" className="px-5 py-3 font-medium">Marks (/{exam.maxMarks})</th>
                    <th scope="col" className="px-5 py-3 font-medium">% / Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exam.classRoom.students.map((s, i) => {
                    const marks = gradeMap.get(s.id);
                    const pct = marks != null ? Math.round((marks / exam.maxMarks) * 100) : null;
                    const grade = pct != null
                      ? pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B"
                        : pct >= 60 ? "C" : pct >= 50 ? "D" : "F"
                      : null;
                    return (
                      <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-5 py-3 text-ink-soft text-xs">{i + 1}</td>
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
                            defaultValue={marks ?? ""}
                            placeholder="—"
                            className="input max-w-[110px]"
                          />
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {pct !== null && grade ? (
                            <span className={`font-semibold ${grade === "F" ? "text-danger" : grade.startsWith("A") ? "text-success" : "text-ink"}`}>
                              {pct}% · {grade}
                            </span>
                          ) : (
                            <span className="text-ink-soft text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {exam.classRoom.students.length === 0 ? (
                <EmptyState title="No students in this class" />
              ) : (
                <div className="px-4 sm:px-5 py-4 border-t border-border flex items-center justify-between gap-4">
                  <p className="text-xs text-ink-soft">
                    {entered} of {exam.classRoom.students.length} marks entered
                  </p>
                  <SubmitButton className="w-full sm:w-auto">Save marks</SubmitButton>
                </div>
              )}
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
