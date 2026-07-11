import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";
import { createTimetableSlot } from "@/lib/actions/timetable";
import SlotDeleteButton from "./delete-button";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ classRoomId?: string }>;
}) {
  const user = await requireUser();
  const { classRoomId: classRoomIdParam } = await searchParams;

  let classRoomId = classRoomIdParam;

  if (!classRoomId) {
    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      classRoomId = student?.classRoomId ?? undefined;
    } else if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: { children: true },
      });
      classRoomId = parent?.children[0]?.classRoomId ?? undefined;
    } else if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
        include: { classesAsTeacher: true },
      });
      classRoomId = teacher?.classesAsTeacher[0]?.id;
    }
  }

  const classRooms = await prisma.classRoom.findMany({ orderBy: { name: "asc" } });
  if (!classRoomId) classRoomId = classRooms[0]?.id;

  const slots = classRoomId
    ? await prisma.timetableSlot.findMany({
        where: { classRoomId },
        include: { subject: true, teacher: { include: { user: true } } },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      })
    : [];

  const [subjects, teachers] = user.role === "ADMIN"
    ? await Promise.all([
        prisma.subject.findMany({ where: { classRoomId }, orderBy: { name: "asc" } }),
        prisma.teacher.findMany({ include: { user: true } }),
      ])
    : [[], []];

  return (
    <div>
      <PageHeader title="Timetable" description="Weekly class schedule." />

      <Card className="p-4 mb-6">
        <form method="get" className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Class</label>
            <select name="classRoomId" defaultValue={classRoomId} className="input min-w-[220px]">
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="ghost">
            View
          </Button>
        </form>
      </Card>

      {user.role === "ADMIN" && (
        <Card className="p-5 mb-6">
          <form action={createTimetableSlot} className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <input type="hidden" name="classRoomId" value={classRoomId} />
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <select name="subjectId" required className="input">
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Teacher</label>
              <select name="teacherId" required className="input">
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Day</label>
              <select name="day" required className="input">
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Room</label>
              <input name="room" className="input" placeholder="Rm 204" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Start</label>
              <input type="time" name="startTime" required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End</label>
              <input type="time" name="endTime" required className="input" />
            </div>
            <div className="lg:col-span-2">
              <Button type="submit" className="w-full">
                Add slot
              </Button>
            </div>
          </form>
        </Card>
      )}

      {slots.length === 0 ? (
        <Card>
          <EmptyState title="No timetable slots yet" description="Add the first class slot above." />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {DAYS.filter((d) => slots.some((s) => s.day === d)).map((day) => (
            <Card key={day} className="overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-primary/5">
                <h3 className="font-display font-semibold text-primary text-sm">
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {slots
                  .filter((s) => s.day === day)
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium">{s.subject.name}</p>
                        <p className="text-xs text-ink-soft">
                          {s.startTime}–{s.endTime} · {s.teacher.user.name}
                          {s.room ? ` · ${s.room}` : ""}
                        </p>
                      </div>
                      {user.role === "ADMIN" && <SlotDeleteButton id={s.id} />}
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
