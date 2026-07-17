import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/org";
import { PageHeader, Card, Button, EmptyState, FormField, FormSelect } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createNote } from "@/lib/actions/notes";
import { NoteAttachmentUploader } from "./attachment-uploader";
import { notFound } from "next/navigation";
import NotesList from "./notes-list";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ classRoomId?: string }>;
}) {
  const user = await requireUser();
  const org = await getOrganization();
  if (!(org as unknown as Record<string, boolean>).notesEnabled) notFound();

  const { classRoomId: classRoomIdParam } = await searchParams;

  // Determine which classes this user can see
  let accessibleClassIds: string[] | "all" = "all";

  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: {
        classesAsTeacher: true,
        subjectsTaught: { include: { subject: true } },
      },
    });
    const fromTeaching = teacher?.subjectsTaught
      .map((s) => s.subject.classRoomId)
      .filter(Boolean) as string[];
    const fromClass = teacher?.classesAsTeacher.map((c) => c.id) ?? [];
    accessibleClassIds = [...new Set([...fromClass, ...fromTeaching])];
  } else if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    accessibleClassIds = student?.classRoomId ? [student.classRoomId] : [];
  } else if (user.role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: { children: true },
    });
    accessibleClassIds = parent?.children.map((c) => c.classRoomId).filter(Boolean) as string[] ?? [];
  }

  const classRooms = await prisma.classRoom.findMany({
    where: accessibleClassIds === "all" ? undefined : { id: { in: accessibleClassIds } },
    orderBy: { name: "asc" },
  });

  const classRoomId = classRoomIdParam ?? classRooms[0]?.id;

  const notes = classRoomId
    ? await prisma.classNote.findMany({
        where: { classRoomId },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { attachments: true },
      })
    : [];

  // Get teacher name map for author display
  const authorIds = [...new Set(notes.map((n) => n.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  });
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  const canPost = user.role === "ADMIN" || user.role === "TEACHER";

  return (
    <div>
      <PageHeader
        title="Class Notes"
        description="Resources, announcements, and study materials posted by teachers."
      />

      {/* Class selector */}
      {classRooms.length > 1 && (
        <Card className="p-4 mb-6">
          <form method="get" className="flex items-end gap-4" aria-label="Choose class">
            <FormSelect label="Class" name="classRoomId" defaultValue={classRoomId}>
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </FormSelect>
            <Button type="submit" variant="ghost">View</Button>
          </form>
        </Card>
      )}

      {classRooms.length === 0 ? (
        <EmptyState
          title="No classes found"
          description={
            user.role === "STUDENT"
              ? "You haven't been assigned to a class yet."
              : "You aren't assigned to any class yet."
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Post new note — teachers and admins only */}
          {canPost && classRoomId && (
            <Card className="p-5">
              <h2 className="font-display font-semibold text-primary mb-4">Post a note</h2>
              <form action={createNote} className="space-y-4">
                <input type="hidden" name="classRoomId" value={classRoomId} />
                <FormField label="Title" name="title" required placeholder="e.g. Chapter 5 summary" />
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-ink mb-1.5">
                    Content <span className="text-ink-soft font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    rows={5}
                    className="input resize-y"
                    placeholder="Write your note here. You can include instructions, summaries, or links."
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink mb-1.5">Attachments</p>
                  <NoteAttachmentUploader name="attachments" />
                </div>
                <SubmitButton>Post note</SubmitButton>
              </form>
            </Card>
          )}

          {/* Notes list */}
          <NotesList
            notes={notes.map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              pinned: n.pinned,
              createdAt: n.createdAt,
              authorId: n.authorId,
              attachments: n.attachments.map((a) => ({ id: a.id, name: a.name, url: a.url })),
            }))}
            authorMap={Object.fromEntries(authorMap)}
            canPost={canPost}
          />
        </div>
      )}
    </div>
  );
}
