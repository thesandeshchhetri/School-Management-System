import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, FormField, FormSelect } from "@/components/ui";
import { createExam } from "@/lib/actions/exams";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import ExamDeleteButton from "./delete-button";
import { ExportCSVLink } from "@/components/csv-export-link";
import { SubmitButton } from "@/components/submit-button";

export default async function ExamsPage() {
  const user = await requireUser();

  if (user.role === "STUDENT" || user.role === "PARENT") {
    return <FamilyGrades userId={user.id} role={user.role} />;
  }

  const [exams, classRooms] = await Promise.all([
    prisma.exam.findMany({
      orderBy: { examDate: "desc" },
      include: { classRoom: true, gradeEntries: true },
    }),
    prisma.classRoom.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Grades & Exams"
        description="Create exams and record marks."
        action={<ExportCSVLink href="/api/export/grades" label="Export all grades" />}
      />

      {user.role === "ADMIN" && (
        <Card className="p-5 mb-6">
          <form action={createExam} className="grid sm:grid-cols-4 gap-3 items-end" aria-label="Create a new exam">
            <div className="sm:col-span-2">
              <FormField label="Exam name" name="name" required placeholder="Mid-Term 2026" />
            </div>
            <FormSelect label="Class" name="classRoomId" required>
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FormSelect>
            <FormField label="Date" name="examDate" type="date" required />
            <FormField label="Max marks" name="maxMarks" type="number" defaultValue={100} />
            <div className="sm:col-span-4">
              <SubmitButton>Create exam</SubmitButton>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {exams.length === 0 ? (
          <EmptyState title="No exams yet" />
        ) : (
          <div className="divide-y divide-border">
            {exams.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3">
                <Link href={`/exams/${e.id}`} className="flex-1">
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-ink-soft">
                    {e.classRoom.name} · {formatDate(e.examDate)} · {e.gradeEntries.length} marks entered
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">Max {e.maxMarks}</Badge>
                  {user.role === "ADMIN" && <ExamDeleteButton id={e.id} name={e.name} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

async function FamilyGrades({ userId, role }: { userId: string; role: string }) {
  let student = await prisma.student.findUnique({
    where: { userId },
    include: {
      gradeEntries: { include: { exam: true, subject: true }, orderBy: { exam: { examDate: "desc" } } },
    },
  });

  if (!student && role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        children: {
          include: {
            gradeEntries: { include: { exam: true, subject: true }, orderBy: { exam: { examDate: "desc" } } },
          },
        },
      },
    });
    student = parent?.children[0] ?? null;
  }

  if (!student) {
    return (
      <div>
        <PageHeader title="Grades & Exams" />
        <EmptyState title="No student record linked" description="Contact your school admin." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Grades & Exams" description={`${student.firstName}'s results`} />
      <Card className="overflow-hidden">
        {student.gradeEntries.length === 0 ? (
          <EmptyState title="No grades recorded yet" />
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">{student.firstName}&apos;s exam results</caption>
            <thead>
              <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                <th scope="col" className="px-5 py-3 font-medium">Exam</th>
                <th scope="col" className="px-5 py-3 font-medium">Subject</th>
                <th scope="col" className="px-5 py-3 font-medium">Marks</th>
                <th scope="col" className="px-5 py-3 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {student.gradeEntries.map((g) => (
                <tr key={g.id}>
                  <td className="px-5 py-3">{g.exam.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{g.subject.name}</td>
                  <td className="px-5 py-3">
                    {g.marksObtained}/{g.exam.maxMarks}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={g.grade === "F" ? "danger" : "success"}>{g.grade}</Badge>
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
