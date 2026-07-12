import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, EmptyState, FormField, FormSelect } from "@/components/ui";
import { createTimetableSlot } from "@/lib/actions/timetable";
import SlotDeleteButton from "./delete-button";
import { ExportCSVLink } from "@/components/csv-export-link";
import { ImportCSVButton } from "@/components/csv-import-button";
import { SubmitButton } from "@/components/submit-button";

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
      <PageHeader
        title="Timetable"
        description="Weekly class schedule."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportCSVLink
              href={classRoomId ? `/api/export/timetable?classRoomId=${classRoomId}` : "/api/export/timetable"}
              label="Export CSV"
            />
            {user.role === "ADMIN" && (
              <ImportCSVButton
                action="/api/import/timetable"
                label="Import CSV"
                templateHint="Columns: Class, Day, Start, End, Subject, Teacher, Room"
                templateUrl="/api/templates/timetable"
              />
            )}
          </div>
        }
      />

      <Card className="p-4 mb-6">
        <form method="get" className="flex items-end gap-4" aria-label="Choose class">
          <FormSelect label="Class" name="classRoomId" defaultValue={classRoomId}>
            {classRooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FormSelect>
          <Button type="submit" variant="ghost">
            View
          </Button>
        </form>
      </Card>

      {user.role === "ADMIN" && (
        <Card className="p-5 mb-6">
          <form
            action={createTimetableSlot}
            className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end"
            aria-label="Add a timetable slot"
          >
            <input type="hidden" name="classRoomId" value={classRoomId} />
            <div className="lg:col-span-2">
              <FormSelect label="Subject" name="subjectId" required>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="lg:col-span-2">
              <FormSelect label="Teacher" name="teacherId" required>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <FormSelect label="Day" name="day" required>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </option>
              ))}
            </FormSelect>
            <FormField label="Room" name="room" placeholder="Rm 204" />
            <FormField label="Start" name="startTime" type="time" required />
            <FormField label="End" name="endTime" type="time" required />
            <div className="lg:col-span-2">
              <SubmitButton className="w-full">Add slot</SubmitButton>
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
                      {user.role === "ADMIN" && (
                        <SlotDeleteButton id={s.id} label={`${s.subject.name} on ${day.charAt(0) + day.slice(1).toLowerCase()}`} />
                      )}
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
