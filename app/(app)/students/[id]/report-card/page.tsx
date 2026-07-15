import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/org";
import { formatDate, letterGrade } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";
import ReportPrintControls from "./print-controls";

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

  if (user.role === "STUDENT") {
    const s = await prisma.student.findUnique({ where: { userId: user.id } });
    if (s?.id !== student.id) notFound();
  }
  if (user.role === "PARENT") {
    const p = await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: true } });
    if (!p?.children.some((c) => c.id === student.id)) notFound();
  }

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

  const totalDays = student.attendances.length;
  const presentDays = student.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

  const canAdmin = user.role === "ADMIN" || user.role === "TEACHER";

  const s = { fontFamily: "system-ui, -apple-system, sans-serif" };

  return (
    <>
      <style>{`
        @media print {
          #report-controls { display: none !important; }
          #report-wrapper {
            margin: 0 !important;
            padding: 1.5rem !important;
            box-shadow: none !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          body { background: white !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>

      <ReportPrintControls exams={exams} currentExamId={examId} />

      <div
        id="report-wrapper"
        style={{
          ...s,
          maxWidth: "750px",
          margin: "1.5rem auto",
          background: "white",
          boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
          padding: "2.5rem",
          borderRadius: "12px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "3px solid #4F46E5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {org.logoUrl && (
              <Image src={org.logoUrl} alt={`${org.name} logo`} width={72} height={72} style={{ objectFit: "contain", borderRadius: "6px" }} />
            )}
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#1A1635", margin: 0 }}>{org.name}</h1>
              {org.address && <p style={{ fontSize: "0.75rem", color: "#6B6B8A", marginTop: "3px", whiteSpace: "pre-line" }}>{org.address}</p>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: 700, fontSize: "1.25rem", color: "#4F46E5", margin: 0 }}>REPORT CARD</p>
            <p style={{ fontSize: "0.75rem", color: "#6B6B8A", marginTop: "3px" }}>Issued: {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Student info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", background: "#F0EEF8", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "2rem" }}>
          <div>
            <p style={{ fontSize: "0.65rem", fontWeight: 600, color: "#6B6B8A", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Student</p>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1A1635", margin: "0 0 2px" }}>{student.firstName} {student.lastName}</p>
            <p style={{ fontSize: "0.8rem", color: "#6B6B8A", margin: 0 }}>{student.admissionNo}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.65rem", fontWeight: 600, color: "#6B6B8A", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Class</p>
            <p style={{ fontWeight: 600, color: "#1A1635", margin: "0 0 2px" }}>{student.classRoom?.name ?? "—"}</p>
            {student.gender && <p style={{ fontSize: "0.8rem", color: "#6B6B8A", margin: 0 }}>{student.gender}</p>}
          </div>
          {attendancePct !== null && (
            <div>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, color: "#6B6B8A", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Attendance</p>
              <p style={{ fontWeight: 600, color: "#1A1635", margin: "0 0 2px" }}>{presentDays}/{totalDays} days</p>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: attendancePct >= 75 ? "#059669" : "#DC2626", margin: 0 }}>{attendancePct}%</p>
            </div>
          )}
        </div>

        {/* Grades per exam */}
        {gradesByExam.size === 0 ? (
          <p style={{ textAlign: "center", color: "#6B6B8A", padding: "2rem 0", fontSize: "0.875rem" }}>No grades recorded yet.</p>
        ) : (
          Array.from(gradesByExam.entries()).map(([, entries]) => {
            const exam = entries[0].exam;
            const total = entries.reduce((sum, g) => sum + g.marksObtained, 0);
            const maxTotal = entries.length * exam.maxMarks;
            const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
            const overallGrade = letterGrade(total, maxTotal);

            return (
              <div key={exam.id} style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#1A1635", margin: 0 }}>{exam.name}</h2>
                  <p style={{ fontSize: "0.75rem", color: "#6B6B8A", margin: 0 }}>{formatDate(exam.examDate)}</p>
                </div>
                <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E2DFF5" }}>
                      <th style={{ textAlign: "left", padding: "8px 0", color: "#6B6B8A", fontWeight: 500 }}>Subject</th>
                      <th style={{ textAlign: "center", padding: "8px 0", color: "#6B6B8A", fontWeight: 500 }}>Marks</th>
                      <th style={{ textAlign: "center", padding: "8px 0", color: "#6B6B8A", fontWeight: 500 }}>Out of</th>
                      <th style={{ textAlign: "center", padding: "8px 0", color: "#6B6B8A", fontWeight: 500 }}>%</th>
                      <th style={{ textAlign: "center", padding: "8px 0", color: "#6B6B8A", fontWeight: 500 }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((g) => {
                      const subjectPct = Math.round((g.marksObtained / exam.maxMarks) * 100);
                      const grade = g.grade ?? letterGrade(g.marksObtained, exam.maxMarks);
                      return (
                        <tr key={g.id} style={{ borderBottom: "1px solid #E2DFF5" }}>
                          <td style={{ padding: "8px 0" }}>{g.subject.name}</td>
                          <td style={{ padding: "8px 0", textAlign: "center", fontWeight: 600 }}>{g.marksObtained}</td>
                          <td style={{ padding: "8px 0", textAlign: "center", color: "#6B6B8A" }}>{exam.maxMarks}</td>
                          <td style={{ padding: "8px 0", textAlign: "center", color: "#6B6B8A" }}>{subjectPct}%</td>
                          <td style={{ padding: "8px 0", textAlign: "center", fontWeight: 700, color: grade === "F" ? "#DC2626" : "#059669" }}>{grade}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #4F46E5" }}>
                      <td style={{ padding: "10px 0", fontWeight: 700, color: "#1A1635" }}>Total</td>
                      <td style={{ padding: "10px 0", textAlign: "center", fontWeight: 700 }}>{total}</td>
                      <td style={{ padding: "10px 0", textAlign: "center", color: "#6B6B8A" }}>{maxTotal}</td>
                      <td style={{ padding: "10px 0", textAlign: "center", fontWeight: 600 }}>{pct}%</td>
                      <td style={{ padding: "10px 0", textAlign: "center", fontWeight: 800, fontSize: "1.125rem", color: overallGrade === "F" ? "#DC2626" : "#4F46E5" }}>{overallGrade}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })
        )}

        {/* Remarks */}
        {canAdmin && (
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #E2DFF5" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B6B8A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Teacher&apos;s Remarks</p>
            <div style={{ height: "48px", borderBottom: "1px dashed #C4BEEB" }} />
          </div>
        )}

        {/* Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #E2DFF5", textAlign: "center", fontSize: "0.75rem", color: "#6B6B8A" }}>
          {["Class Teacher", "Principal", "Parent / Guardian"].map((label) => (
            <div key={label}>
              <div style={{ height: "40px", borderBottom: "1px solid #C4BEEB", marginBottom: "6px" }} />
              {label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.7rem", color: "#6B6B8A" }}>
          {org.name} · Report card generated on {formatDate(new Date())}
        </p>
      </div>
    </>
  );
}
