import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/org";
import { PageHeader, Card, Button, EmptyState, FormField, FormSelect } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createNote } from "@/lib/actions/notes";
import { DeleteNoteButton, PinNoteButton } from "./note-buttons";
import { NoteAttachmentUploader } from "./attachment-uploader";
import { formatDate } from "@/lib/utils";
import { FileIcon, Pin } from "lucide-react";
import { notFound } from "next/navigation";

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
          {notes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description={
                canPost
                  ? "Post the first note for this class using the form above."
                  : "Your teacher hasn't posted any notes yet."
              }
            />
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  className={`overflow-hidden ${note.pinned ? "border-accent/40 bg-accent-soft/20" : ""}`}
                >
                  <div className="px-5 py-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {note.pinned && (
                          <Pin className="w-3.5 h-3.5 text-accent shrink-0" aria-label="Pinned" />
                        )}
                        <h3 className="font-display font-semibold text-primary truncate">
                          {note.title}
                        </h3>
                      </div>
                      {canPost && (
                        <div className="flex items-center gap-1 shrink-0">
                          <PinNoteButton id={note.id} pinned={note.pinned} />
                          <DeleteNoteButton id={note.id} title={note.title} />
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <p className="text-xs text-ink-soft mb-3">
                      {(authorMap.get(note.authorId) as string | undefined) ?? "Teacher"} · {formatDate(note.createdAt)}
                      {note.updatedAt > note.createdAt ? " (edited)" : ""}
                    </p>

                    {/* Body */}
                    {note.body && (
                      <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed mb-4">
                        {note.body}
                      </div>
                    )}

                    {/* Attachments */}
                    {note.attachments.length > 0 && (
                      <div className="border-t border-border pt-3">
                        <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
                          Attachments
                        </p>
                        <ul className="space-y-1.5">
                          {note.attachments.map((att) => (
                            <li key={att.id}>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-border/50 transition-colors max-w-full"
                              >
                                <FileIcon className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                                <span className="truncate text-xs font-medium">{att.name}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
