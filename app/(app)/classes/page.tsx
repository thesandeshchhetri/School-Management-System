import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ui";
import { createClassRoom, createSubject } from "@/lib/actions/academics";
import ClassDeleteButton from "./class-delete-button";
import SubjectDeleteButton from "./subject-delete-button";

export default async function ClassesPage() {
  await requireRole(["ADMIN"]);

  const [classRooms, subjects, teachers] = await Promise.all([
    prisma.classRoom.findMany({
      orderBy: { gradeLevel: "asc" },
      include: { classTeacher: { include: { user: true } }, students: true },
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: { classRoom: true, teachers: { include: { teacher: { include: { user: true } } } } },
    }),
    prisma.teacher.findMany({ include: { user: true } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Classes & Subjects" description="Structure your school's academic year." />

      {/* Classes */}
      <div>
        <h2 className="font-display font-semibold text-primary mb-3">Classes</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <form action={createClassRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Class name</label>
                  <input name="name" required className="input" placeholder="Grade 8 - Section A" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Grade level</label>
                  <input name="gradeLevel" type="number" required className="input" placeholder="8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Section</label>
                  <input name="section" className="input" placeholder="A" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Capacity</label>
                  <input name="capacity" type="number" className="input" placeholder="40" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Class teacher</label>
                <select name="classTeacherId" className="input">
                  <option value="">None</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">Add class</Button>
            </form>
          </Card>

          <Card className="overflow-hidden">
            {classRooms.length === 0 ? (
              <EmptyState title="No classes yet" description="Create your first class on the left." />
            ) : (
              <div className="divide-y divide-border">
                {classRooms.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-ink-soft">
                        {c.classTeacher?.user.name ?? "No class teacher"} · {c.students.length}/{c.capacity} students
                      </p>
                    </div>
                    <ClassDeleteButton id={c.id} name={c.name} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Subjects */}
      <div>
        <h2 className="font-display font-semibold text-primary mb-3">Subjects</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <form action={createSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Subject name</label>
                  <input name="name" required className="input" placeholder="Mathematics" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Code</label>
                  <input name="code" required className="input" placeholder="MATH-08" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Class</label>
                <select name="classRoomId" className="input">
                  <option value="">Any / not tied to a class</option>
                  {classRooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Teacher</label>
                <select name="teacherId" className="input">
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">Add subject</Button>
            </form>
          </Card>

          <Card className="overflow-hidden">
            {subjects.length === 0 ? (
              <EmptyState title="No subjects yet" description="Create your first subject on the left." />
            ) : (
              <div className="divide-y divide-border">
                {subjects.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {s.name} <span className="text-ink-soft font-normal">({s.code})</span>
                      </p>
                      <p className="text-xs text-ink-soft">
                        {s.classRoom?.name ?? "Not tied to a class"} ·{" "}
                        {s.teachers[0]?.teacher.user.name ?? "Unassigned"}
                      </p>
                    </div>
                    <SubjectDeleteButton id={s.id} name={s.name} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
