import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, StatCard, Badge } from "@/components/ui";
import { Users, UserCheck, Wallet, CalendarCheck, School, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AttendanceBarChart, FeeStatusPieChart } from "./charts";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") return <AdminOverview />;
  if (user.role === "TEACHER") return <TeacherOverview teacherUserId={user.id} />;
  return <FamilyOverview userId={user.id} role={user.role} />;
}

async function AdminOverview() {
  // Last 7 days for attendance chart
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    studentCount,
    teacherCount,
    classCount,
    parentCount,
    feeStats,
    recentStudents,
    recentAttendance,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.classRoom.count(),
    prisma.parent.count(),
    prisma.feeInvoice.groupBy({ by: ["status"], _count: true }),
    prisma.student.findMany({
      take: 5,
      orderBy: { enrolledOn: "desc" },
      include: { classRoom: true },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: sevenDaysAgo, lte: today } },
      select: { date: true, status: true },
    }),
  ]);

  // Build 7-day attendance chart data
  const attendanceByDay: Record<string, { present: number; absent: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
    attendanceByDay[key] = { present: 0, absent: 0 };
  }
  for (const a of recentAttendance) {
    const key = new Date(a.date).toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
    if (attendanceByDay[key]) {
      if (a.status === "PRESENT" || a.status === "LATE") attendanceByDay[key].present++;
      else attendanceByDay[key].absent++;
    }
  }
  const chartData = Object.entries(attendanceByDay).map(([date, v]) => ({ date, ...v }));

  // Fee pie chart
  const feeMap = Object.fromEntries(feeStats.map((f) => [f.status, f._count]));
  const feePieData = [
    { name: "Paid", value: feeMap["PAID"] ?? 0 },
    { name: "Unpaid", value: feeMap["UNPAID"] ?? 0 },
    { name: "Partial", value: feeMap["PARTIAL"] ?? 0 },
    { name: "Overdue", value: feeMap["OVERDUE"] ?? 0 },
  ].filter((d) => d.value > 0);

  const unpaidAmount = await prisma.feeInvoice.aggregate({
    where: { status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } },
    _sum: { amount: true },
  });

  return (
    <div>
      <PageHeader title="School overview" description="Live snapshot of your school." />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { href: "/students/new", label: "➕ Add student" },
          { href: "/teachers/new", label: "➕ Add teacher" },
          { href: "/attendance",   label: "✅ Mark attendance" },
          { href: "/fees",         label: "💰 Create invoice" },
          { href: "/notes",        label: "📝 Post note" },
          { href: "/exams",        label: "📊 Enter grades" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="inline-flex items-center rounded-xl border border-border bg-white/70 hover:bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-colors"
          >
            {a.label}
          </Link>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Students" value={studentCount} icon={Users} tone="primary" />
        <StatCard label="Teachers" value={teacherCount} icon={UserCheck} tone="accent" />
        <StatCard label="Classes" value={classCount} icon={School} tone="success" />
        <StatCard label="Parents" value={parentCount} icon={Users} tone="neutral" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-primary text-sm">
              Attendance — last 7 days
            </h2>
            <Link href="/attendance" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {recentAttendance.length === 0 ? (
            <p className="text-sm text-ink-soft py-8 text-center">No attendance data yet.</p>
          ) : (
            <AttendanceBarChart data={chartData} />
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-primary text-sm">Fee collection status</h2>
            <Link href="/fees" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {feePieData.length === 0 ? (
            <p className="text-sm text-ink-soft py-8 text-center">No invoices yet.</p>
          ) : (
            <>
              <FeeStatusPieChart data={feePieData} />
              <p className="text-center text-sm text-danger font-medium mt-1">
                {formatCurrency(unpaidAmount._sum.amount ?? 0)} outstanding
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Recently enrolled */}
      <Card>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-primary">Recently enrolled</h2>
          <Link href="/students" className="text-xs text-accent hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-border">
          {recentStudents.length === 0 ? (
            <p className="text-sm text-ink-soft px-5 py-6">No students yet.</p>
          ) : (
            recentStudents.map((s) => (
              <Link
                key={s.id}
                href={`/students/${s.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-background transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-ink-soft">
                    {s.classRoom?.name ?? "Unassigned"} · {s.admissionNo}
                  </p>
                </div>
                <span className="text-xs text-ink-soft">{formatDate(s.enrolledOn)}</span>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

async function TeacherOverview({ teacherUserId }: { teacherUserId: string }) {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase() as
    "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    include: {
      classesAsTeacher: { include: { students: true } },
      subjectsTaught: { include: { subject: true } },
      timetableSlots: {
        where: { day: dayName },
        include: { classRoom: true, subject: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  const studentTotal = teacher?.classesAsTeacher.reduce((sum, c) => sum + c.students.length, 0) ?? 0;

  // Pending attendance — classes where today's attendance hasn't been fully marked
  const classIds = teacher?.classesAsTeacher.map((c) => c.id) ?? [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const markedTodayCount = await prisma.attendance.count({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      student: { classRoomId: { in: classIds } },
    },
  });
  void markedTodayCount;

  return (
    <div>
      <PageHeader title="My overview" description={`${today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="My classes" value={teacher?.classesAsTeacher.length ?? 0} icon={School} tone="primary" />
        <StatCard label="Students" value={studentTotal} icon={Users} tone="accent" />
        <StatCard label="Subjects" value={teacher?.subjectsTaught.length ?? 0} icon={TrendingUp} tone="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's timetable */}
        <Card>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-primary">Today&apos;s schedule</h2>
            <Link href="/timetable" className="text-xs text-accent hover:underline">Full timetable</Link>
          </div>
          <div className="divide-y divide-border">
            {(teacher?.timetableSlots.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-soft px-5 py-6">No classes scheduled today.</p>
            ) : (
              teacher?.timetableSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{slot.subject.name}</p>
                    <p className="text-xs text-ink-soft">{slot.classRoom.name}</p>
                  </div>
                  <span className="text-xs text-ink-soft font-mono">{slot.startTime}–{slot.endTime}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* My classes */}
        <Card>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-primary">My classes</h2>
            <Link href="/attendance" className="text-xs text-accent hover:underline">Mark attendance</Link>
          </div>
          <div className="divide-y divide-border">
            {(teacher?.classesAsTeacher.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-soft px-5 py-6">
                You&apos;re not assigned as a class teacher yet.
              </p>
            ) : (
              teacher?.classesAsTeacher.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-ink-soft">{c.students.length} students</p>
                  </div>
                  <Link
                    href={`/attendance?classRoomId=${c.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    Mark today
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

async function FamilyOverview({ userId, role }: { userId: string; role: string }) {
  let student = await prisma.student.findUnique({
    where: { userId },
    include: {
      classRoom: true,
      feeInvoices: true,
      attendances: { orderBy: { date: "desc" }, take: 14 },
      gradeEntries: {
        orderBy: { exam: { examDate: "desc" } },
        take: 5,
        include: { exam: true, subject: true },
      },
    },
  });

  if (!student && role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        children: {
          include: {
            classRoom: true,
            feeInvoices: true,
            attendances: { orderBy: { date: "desc" }, take: 14 },
            gradeEntries: {
              orderBy: { exam: { examDate: "desc" } },
              take: 5,
              include: { exam: true, subject: true },
            },
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
          No student record is linked to this account yet. Contact your school admin.
        </Card>
      </div>
    );
  }

  const presentCount = student.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendancePct = student.attendances.length > 0
    ? Math.round((presentCount / student.attendances.length) * 100)
    : null;
  const outstanding = student.feeInvoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div>
      <PageHeader
        title={`${student.firstName}'s overview`}
        description={student.classRoom?.name ?? "No class assigned"}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Attendance"
          value={attendancePct !== null ? `${attendancePct}%` : "—"}
          icon={CalendarCheck}
          tone={attendancePct !== null && attendancePct < 75 ? "danger" : "success"}
        />
        <StatCard
          label="Days present"
          value={`${presentCount}/${student.attendances.length}`}
          icon={CalendarCheck}
          tone="primary"
        />
        <StatCard
          label="Outstanding fees"
          value={formatCurrency(outstanding)}
          icon={Wallet}
          tone={outstanding > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Class"
          value={student.classRoom?.name ?? "—"}
          icon={School}
          tone="accent"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent attendance */}
        <Card>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-primary">Recent attendance</h2>
            <Link href="/attendance" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {student.attendances.length === 0 ? (
              <p className="text-sm text-ink-soft px-5 py-6">No attendance recorded yet.</p>
            ) : (
              student.attendances.slice(0, 7).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm">{formatDate(a.date)}</span>
                  <Badge tone={
                    a.status === "PRESENT" ? "success"
                    : a.status === "LATE" ? "warn"
                    : a.status === "EXCUSED" ? "neutral"
                    : "danger"
                  }>
                    {a.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent grades */}
        <Card>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-primary">Recent grades</h2>
            <Link href="/exams" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {student.gradeEntries.length === 0 ? (
              <p className="text-sm text-ink-soft px-5 py-6">No grades recorded yet.</p>
            ) : (
              student.gradeEntries.map((g) => (
                <div key={g.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{g.subject.name}</p>
                    <p className="text-xs text-ink-soft">{g.exam.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={g.grade === "F" ? "danger" : "success"}>{g.grade}</Badge>
                    <p className="text-xs text-ink-soft mt-0.5">{g.marksObtained}/{g.exam.maxMarks}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
