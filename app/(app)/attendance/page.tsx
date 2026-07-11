import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, Badge, EmptyState, FormField, FormSelect } from "@/components/ui";
import { markAttendance } from "@/lib/actions/attendance";
import { formatDate } from "@/lib/utils";
import { ExportCSVLink } from "@/components/csv-export-link";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classRoomId?: string; date?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  if (user.role === "STUDENT" || user.role === "PARENT") {
    return <FamilyAttendance userId={user.id} role={user.role} />;
  }

  return <StaffAttendance userId={user.id} role={user.role} params={params} />;
}

async function StaffAttendance({
  userId,
  role,
  params,
}: {
  userId: string;
  role: string;
  params: { classRoomId?: string; date?: string };
}) {
  const classRooms =
    role === "ADMIN"
      ? await prisma.classRoom.findMany({ orderBy: { name: "asc" } })
      : await prisma.classRoom.findMany({
          where: { classTeacher: { userId } },
          orderBy: { name: "asc" },
        });

  const classRoomId = params.classRoomId ?? classRooms[0]?.id;
  const date = params.date ?? new Date().toISOString().slice(0, 10);

  const students = classRoomId
    ? await prisma.student.findMany({
        where: { classRoomId },
        orderBy: { firstName: "asc" },
        include: {
          attendances: { where: { date: new Date(date) } },
        },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark and review daily attendance."
        action={
          <ExportCSVLink
            href={classRoomId ? `/api/export/attendance?classRoomId=${classRoomId}` : "/api/export/attendance"}
            label="Export CSV"
          />
        }
      />

      <Card className="p-5 mb-6">
        <form method="get" className="flex flex-wrap items-end gap-4" aria-label="Choose class and date">
          <FormSelect label="Class" name="classRoomId" defaultValue={classRoomId}>
            {classRooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FormSelect>
          <FormField label="Date" name="date" type="date" defaultValue={date} />
          <Button type="submit" variant="ghost">
            Load
          </Button>
        </form>
      </Card>

      {classRooms.length === 0 ? (
        <EmptyState title="No classes assigned" description="You aren't assigned to any class yet." />
      ) : (
        <Card className="overflow-hidden">
          <form action={markAttendance} aria-label={`Mark attendance for ${formatDate(date)}`}>
            <input type="hidden" name="classRoomId" value={classRoomId} />
            <input type="hidden" name="date" value={date} />
            <table className="w-full text-sm">
              <caption className="sr-only">Attendance for {formatDate(date)}</caption>
              <thead>
                <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                  <th scope="col" className="px-5 py-3 font-medium">Student</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-medium">
                      {s.firstName} {s.lastName}
                      <input type="hidden" name="studentId" value={s.id} />
                    </td>
                    <td className="px-5 py-3">
                      <fieldset className="flex gap-3 border-0 p-0 m-0">
                        <legend className="sr-only">
                          Attendance status for {s.firstName} {s.lastName}
                        </legend>
                        {["PRESENT", "LATE", "EXCUSED", "ABSENT"].map((status) => (
                          <label key={status} className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name={`status-${s.id}`}
                              value={status}
                              defaultChecked={
                                (s.attendances[0]?.status ?? "PRESENT") === status
                              }
                            />
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </label>
                        ))}
                      </fieldset>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 ? (
              <EmptyState title="No students in this class yet" />
            ) : (
              <div className="px-5 py-4 border-t border-border">
                <Button type="submit">Save attendance</Button>
              </div>
            )}
          </form>
        </Card>
      )}
    </div>
  );
}

async function FamilyAttendance({ userId, role }: { userId: string; role: string }) {
  let student = await prisma.student.findUnique({
    where: { userId },
    include: { attendances: { orderBy: { date: "desc" } } },
  });

  if (!student && role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: { children: { include: { attendances: { orderBy: { date: "desc" } } } } },
    });
    student = parent?.children[0] ?? null;
  }

  if (!student) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <EmptyState title="No student record linked" description="Contact your school admin." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Attendance" description={`${student.firstName}'s attendance history`} />
      <Card className="overflow-hidden">
        {student.attendances.length === 0 ? (
          <EmptyState title="No attendance recorded yet" />
        ) : (
          <div className="divide-y divide-border">
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
        )}
      </Card>
    </div>
  );
}
