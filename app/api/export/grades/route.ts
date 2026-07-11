import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCSV, csvResponse } from "@/lib/csv";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const examId = req.nextUrl.searchParams.get("examId") ?? undefined;

  const entries = await prisma.gradeEntry.findMany({
    where: examId ? { examId } : undefined,
    orderBy: [{ exam: { examDate: "desc" } }],
    include: { student: true, subject: true, exam: true },
  });

  const csv = toCSV(
    entries.map((g) => ({
      student: `${g.student.firstName} ${g.student.lastName}`,
      admissionNo: g.student.admissionNo,
      exam: g.exam.name,
      subject: g.subject.name,
      marks: g.marksObtained,
      maxMarks: g.exam.maxMarks,
      grade: g.grade ?? "",
    })),
    [
      { key: "student", label: "Student" },
      { key: "admissionNo", label: "Admission No" },
      { key: "exam", label: "Exam" },
      { key: "subject", label: "Subject" },
      { key: "marks", label: "Marks" },
      { key: "maxMarks", label: "Max Marks" },
      { key: "grade", label: "Grade" },
    ]
  );

  return csvResponse("grades.csv", csv);
}
