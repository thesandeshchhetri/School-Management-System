import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState, FormField, FormSelect } from "@/components/ui";
import { createClassRoom, createSubject } from "@/lib/actions/academics";
import ClassDeleteButton from "./class-delete-button";
import SubjectDeleteButton from "./subject-delete-button";
import { SubmitButton } from "@/components/submit-button";
import { ExportCSVLink } from "@/components/csv-export-link";
import { ImportCSVButton } from "@/components/csv-import-button";

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
      <section aria-labelledby="classes-heading">
        <h2 id="classes-heading" className="font-display font-semibold text-primary mb-3">
          Classes
        </h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <form action={createClassRoom} className="space-y-4" aria-label="Add a new class">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Class name" name="name" required placeholder="Grade 8 - Section A" />
                <FormField label="Grade level" name="gradeLevel" type="number" required placeholder="8" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Section" name="section" placeholder="A" />
                <FormField label="Capacity" name="capacity" type="number" placeholder="40" />
              </div>
              <FormSelect label="Class teacher" name="classTeacherId">
                <option value="">None</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name}
                  </option>
                ))}
              </FormSelect>
              <SubmitButton className="w-full">Add class</SubmitButton>
            </form>
          </Card>

          <Card className="overflow-hidden">
            {classRooms.length === 0 ? (
              <EmptyState title="No classes yet" description="Create your first class on the left." />
            ) : (
              <ul className="divide-y divide-border">
                {classRooms.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-ink-soft">
                        {c.classTeacher?.user.name ?? "No class teacher"} · {c.students.length}/{c.capacity} students
                      </p>
                    </div>
                    <ClassDeleteButton id={c.id} name={c.name} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      {/* Subjects */}
      <section aria-labelledby="subjects-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 id="subjects-heading" className="font-display font-semibold text-primary">
            Subjects
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <ExportCSVLink href="/api/export/subjects" label="Export CSV" />
            <ImportCSVButton
              action="/api/import/subjects"
              label="Import CSV"
              templateHint="Columns: Subject Name, Code, Class, Teacher"
              templateUrl="/api/templates/subjects"
            />
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <form action={createSubject} className="space-y-4" aria-label="Add a new subject">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Subject name" name="name" required placeholder="Mathematics" />
                <FormField label="Code" name="code" required placeholder="MATH-08" />
              </div>
              <FormSelect label="Class" name="classRoomId">
                <option value="">Any / not tied to a class</option>
                {classRooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </FormSelect>
              <FormSelect label="Teacher" name="teacherId">
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name}
                  </option>
                ))}
              </FormSelect>
              <SubmitButton className="w-full">Add subject</SubmitButton>
            </form>
          </Card>

          <Card className="overflow-hidden">
            {subjects.length === 0 ? (
              <EmptyState title="No subjects yet" description="Create your first subject on the left." />
            ) : (
              <ul className="divide-y divide-border">
                {subjects.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-5 py-3">
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
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
