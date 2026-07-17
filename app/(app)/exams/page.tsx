import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, FormField, FormSelect } from "@/components/ui";
import { createExam } from "@/lib/actions/exams";
import { formatDate } from "@/lib/utils";
import { SubmitButton } from "@/components/submit-button";
import { ExportCSVLink } from "@/components/csv-export-link";
import ExamsList from "./exams-list";

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
          <h2 className="font-display font-semibold text-ink mb-4 text-sm">New exam</h2>
          <form action={createExam} className="grid sm:grid-cols-4 gap-3 items-end" aria-label="Create a new exam">
            <div className="sm:col-span-2">
              <FormField label="Exam name" name="name" required placeholder="Mid-Term 2026" />
            </div>
            <FormSelect label="Class" name="classRoomId" required>
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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

      {exams.length === 0 ? (
        <Card><EmptyState title="No exams yet" /></Card>
      ) : (
        <ExamsList
          exams={exams.map((e) => ({
            id: e.id,
            name: e.name,
            examDate: e.examDate,
            maxMarks: e.maxMarks,
            classRoom: { id: e.classRoom.id, name: e.classRoom.name },
            gradeEntries: e.gradeEntries.map((g) => ({ id: g.id })),
          }))}
          classRooms={classRooms}
          isAdmin={user.role === "ADMIN"}
        />
      )}
    </div>
  );
}

async function FamilyGrades({ userId, role }: { userId: string; role: string }) {
  let student = await prisma.student.findUnique({
    where: { userId },
    include: { gradeEntries: { include: { exam: true, subject: true }, orderBy: { exam: { examDate: "desc" } } } },
  });

  if (!student && role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: { children: { include: { gradeEntries: { include: { exam: true, subject: true }, orderBy: { exam: { examDate: "desc" } } } } } },
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
          <>
            <ul className="sm:hidden divide-y divide-border">
              {student.gradeEntries.map((g) => (
                <li key={g.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{g.subject.name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{g.exam.name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={g.grade === "F" ? "danger" : "success"}>{g.grade}</Badge>
                    <p className="text-xs text-ink-soft mt-1">{g.marksObtained}/{g.exam.maxMarks}</p>
                  </div>
                </li>
              ))}
            </ul>
            <table className="hidden sm:table w-full text-sm">
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
                    <td className="px-5 py-3">{g.marksObtained}/{g.exam.maxMarks}</td>
                    <td className="px-5 py-3">
                      <Badge tone={g.grade === "F" ? "danger" : "success"}>{g.grade}</Badge>
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
