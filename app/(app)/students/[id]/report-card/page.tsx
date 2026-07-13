import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/org";
import { formatDate, letterGrade } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function ReportCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ examId?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { examId } = await searchParams;

  const [student, org] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      include: {
        classRoom: true,
        gradeEntries: {
          where: examId ? { examId } : undefined,
          include: { exam: true, subject: true },
          orderBy: [{ exam: { examDate: "asc" } }, { subject: { name: "asc" } }],
        },
        attendances: true,
      },
    }),
    getOrganization(),
  ]);

  if (!student) notFound();

  // Access control — students and parents can only view their own
  if (user.role === "STUDENT") {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s?.id !== student.id) notFound();
  }
  if (user.role === "PARENT") {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    if (!p?.children.some((c) => c.id === student.id)) notFound();
  }

  // Get all exams for this class for the selector
  const exams = student.classRoom
    ? await prisma.exam.findMany({
        where: { classRoomId: student.classRoom.id },
        orderBy: { examDate: "desc" },
      })
    : [];

  // Group grades by exam
  const gradesByExam = new Map<string, typeof student.gradeEntries>();
  for (const g of student.gradeEntries) {
    if (!gradesByExam.has(g.examId)) gradesByExam.set(g.examId, []);
    gradesByExam.get(g.examId)!.push(g);
  }

  // Attendance summary
  const totalDays = student.attendances.length;
  const presentDays = student.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

  const canAdmin = user.role === "ADMIN" || user.role === "TEACHER";

  return (
    <div className="min-h-screen bg-background">
      {/* Controls — hidden when printing */}
      <div className="print:hidden flex flex-wrap items-center gap-3 p-4 border-b border-border bg-surface">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-soft transition-colors"
        >
          🖨️ Print report card
        </button>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-border/50 transition-colors"
        >
          ← Back
        </button>
        {exams.length > 1 && (
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="examId" className="text-sm font-medium">Filter by exam:</label>
            <select
              id="examId"
              name="examId"
              defaultValue={examId ?? ""}
              className="input text-sm py-1"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) url.searchParams.set("examId", e.target.value);
                else url.searchParams.delete("examId");
                window.location.href = url.toString();
              }}
            >
              <option value="">All exams</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </form>
        )}
      </div>

      {/* Report card — A4 printable */}
      <div className="max-w-3xl mx-auto bg-surface shadow-sm print:shadow-none p-10 print:p-6 mt-6 print:mt-0">

        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b-2 border-primary">
          <div className="flex items-center gap-4">
            {org.logoUrl && (
              <Image src={org.logoUrl} alt={`${org.name} logo`} width={72} height={72} className="object-contain rounded" />
            )}
            <div>
              <h1 className="font-display text-2xl font-extrabold text-primary">{org.name}</h1>
              {org.address && <p className="text-xs text-ink-soft mt-0.5 whitespace-pre-line">{org.address}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-xl text-primary">REPORT CARD</p>
            <p className="text-xs text-ink-soft mt-1">Issued: {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Student info */}
        <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-background rounded-xl">
          <div>
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">Student</p>
            <p className="font-display font-bold text-lg text-primary">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-sm text-ink-soft">{student.admissionNo}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">Class</p>
            <p className="font-medium">{student.classRoom?.name ?? "—"}</p>
            {student.gender && <p className="text-sm text-ink-soft">{student.gender}</p>}
          </div>
          {attendancePct !== null && (
            <div>
              <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">Attendance</p>
              <p className="font-medium">
                {presentDays}/{totalDays} days
                <span className={`ml-2 text-sm font-semibold ${attendancePct >= 75 ? "text-success" : "text-danger"}`}>
                  ({attendancePct}%)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Grades — grouped by exam */}
        {gradesByExam.size === 0 ? (
          <p className="text-sm text-ink-soft text-center py-8">No grades recorded yet.</p>
        ) : (
          Array.from(gradesByExam.entries()).map(([, entries]) => {
            const exam = entries[0].exam;
            const total = entries.reduce((sum, g) => sum + g.marksObtained, 0);
            const maxTotal = entries.length * exam.maxMarks;
            const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
            const overallGrade = letterGrade(total, maxTotal);

            return (
              <div key={exam.id} className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display font-semibold text-primary">{exam.name}</h2>
                  <p className="text-xs text-ink-soft">{formatDate(exam.examDate)}</p>
                </div>
                <table className="w-full text-sm mb-2">
                  <thead>
                    <tr className="border-b-2 border-primary/20">
                      <th className="text-left py-2 font-medium text-ink-soft">Subject</th>
                      <th className="text-center py-2 font-medium text-ink-soft">Marks</th>
                      <th className="text-center py-2 font-medium text-ink-soft">Out of</th>
                      <th className="text-center py-2 font-medium text-ink-soft">%</th>
                      <th className="text-center py-2 font-medium text-ink-soft">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((g) => {
                      const pctSubject = Math.round((g.marksObtained / exam.maxMarks) * 100);
                      return (
                        <tr key={g.id} className="border-b border-border">
                          <td className="py-2">{g.subject.name}</td>
                          <td className="py-2 text-center font-medium">{g.marksObtained}</td>
                          <td className="py-2 text-center text-ink-soft">{exam.maxMarks}</td>
                          <td className="py-2 text-center text-ink-soft">{pctSubject}%</td>
                          <td className="py-2 text-center">
                            <span className={`font-bold ${g.grade === "F" ? "text-danger" : "text-success"}`}>
                              {g.grade ?? letterGrade(g.marksObtained, exam.maxMarks)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-primary/20 font-semibold">
                      <td className="py-2">Total</td>
                      <td className="py-2 text-center">{total}</td>
                      <td className="py-2 text-center text-ink-soft">{maxTotal}</td>
                      <td className="py-2 text-center">{pct}%</td>
                      <td className="py-2 text-center">
                        <span className={`font-bold text-lg ${overallGrade === "F" ? "text-danger" : "text-primary"}`}>
                          {overallGrade}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })
        )}

        {/* Remarks section */}
        {canAdmin && (
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-3">Teacher&apos;s Remarks</p>
            <div className="h-16 border-b border-dashed border-border" />
          </div>
        )}

        {/* Signatures */}
        <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-6 text-center text-xs text-ink-soft">
          <div>
            <div className="h-10 border-b border-border mb-1" />
            Class Teacher
          </div>
          <div>
            <div className="h-10 border-b border-border mb-1" />
            Principal
          </div>
          <div>
            <div className="h-10 border-b border-border mb-1" />
            Parent / Guardian
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-ink-soft">
          {org.name} · Report card generated on {formatDate(new Date())}
        </p>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}
