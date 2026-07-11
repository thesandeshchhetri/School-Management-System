import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, StatCard, Badge } from "@/components/ui";
import { Users, UserCheck, Wallet, CalendarCheck, School } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") return <AdminOverview />;
  if (user.role === "TEACHER") return <TeacherOverview teacherUserId={user.id} />;
  return <FamilyOverview userId={user.id} role={user.role} />;
}

async function AdminOverview() {
  const [studentCount, teacherCount, classCount, unpaidInvoices, recentStudents] =
    await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.classRoom.count(),
      prisma.feeInvoice.aggregate({
        where: { status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.student.findMany({
        take: 5,
        orderBy: { enrolledOn: "desc" },
        include: { classRoom: true },
      }),
    ]);

  return (
    <div>
      <PageHeader
        title="School overview"
        description="A snapshot of Brightpath, updated in real time."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Students enrolled" value={studentCount} icon={Users} tone="primary" />
        <StatCard label="Teaching staff" value={teacherCount} icon={UserCheck} tone="accent" />
        <StatCard label="Active classes" value={classCount} icon={School} tone="success" />
        <StatCard
          label="Outstanding fees"
          value={formatCurrency(unpaidInvoices._sum.amount ?? 0)}
          icon={Wallet}
          tone="danger"
        />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-primary">Recently enrolled</h2>
        </div>
        <div className="divide-y divide-border">
          {recentStudents.length === 0 && (
            <p className="text-sm text-ink-soft px-5 py-6">
              No students yet — add your first one from the Students page.
            </p>
          )}
          {recentStudents.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium">
                  {s.firstName} {s.lastName}
                </p>
                <p className="text-xs text-ink-soft">
                  {s.classRoom?.name ?? "Unassigned class"} · {s.admissionNo}
                </p>
              </div>
              <span className="text-xs text-ink-soft">{formatDate(s.enrolledOn)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

async function TeacherOverview({ teacherUserId }: { teacherUserId: string }) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    include: {
      classesAsTeacher: { include: { students: true } },
      subjectsTaught: { include: { subject: true } },
      timetableSlots: { include: { classRoom: true, subject: true } },
    },
  });

  const studentTotal =
    teacher?.classesAsTeacher.reduce((sum, c) => sum + c.students.length, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="My teaching overview"
        description="Your classes, subjects, and today's schedule."
      />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Classes as teacher" value={teacher?.classesAsTeacher.length ?? 0} icon={School} tone="primary" />
        <StatCard label="Students taught" value={studentTotal} icon={Users} tone="accent" />
        <StatCard label="Subjects" value={teacher?.subjectsTaught.length ?? 0} icon={UserCheck} tone="success" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-primary">My classes</h2>
        </div>
        <div className="divide-y divide-border">
          {(teacher?.classesAsTeacher.length ?? 0) === 0 && (
            <p className="text-sm text-ink-soft px-5 py-6">
              You&apos;re not assigned as a class teacher yet.
            </p>
          )}
          {teacher?.classesAsTeacher.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <p className="text-sm font-medium">{c.name}</p>
              <Badge tone="neutral">{c.students.length} students</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

async function FamilyOverview({ userId, role }: { userId: string; role: string }) {
  let student = await prisma.student.findUnique({
    where: { userId },
    include: {
      classRoom: true,
      feeInvoices: true,
      attendances: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  // Parent: show first child if no direct student record
  if (!student && role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        children: {
          include: {
            classRoom: true,
            feeInvoices: true,
            attendances: { orderBy: { date: "desc" }, take: 10 },
          },
        },
      },
    });
    student = parent?.children[0] ?? null;
  }

  if (!student) {
    return (
      <div>
        <PageHeader title="Overview" />
        <Card className="p-8 text-center text-sm text-ink-soft">
          No student record is linked to this account yet. Contact your school
          admin to get set up.
        </Card>
      </div>
    );
  }

  const presentCount = student.attendances.filter((a) => a.status === "PRESENT").length;
  const outstanding = student.feeInvoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div>
      <PageHeader
        title={`${student.firstName}'s overview`}
        description={student.classRoom?.name ?? "No class assigned"}
      />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Recent attendance"
          value={`${presentCount}/${student.attendances.length || 0}`}
          icon={CalendarCheck}
          tone="primary"
        />
        <StatCard label="Outstanding fees" value={formatCurrency(outstanding)} icon={Wallet} tone="danger" />
        <StatCard label="Class" value={student.classRoom?.name ?? "—"} icon={School} tone="accent" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-primary">Recent attendance</h2>
        </div>
        <div className="divide-y divide-border">
          {student.attendances.length === 0 && (
            <p className="text-sm text-ink-soft px-5 py-6">No attendance recorded yet.</p>
          )}
          {student.attendances.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm">{formatDate(a.date)}</span>
              <Badge
                tone={
                  a.status === "PRESENT"
                    ? "success"
                    : a.status === "LATE"
                    ? "warn"
                    : a.status === "EXCUSED"
                    ? "neutral"
                    : "danger"
                }
              >
                {a.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
