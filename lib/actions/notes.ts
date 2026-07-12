"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function createNote(formData: FormData) {
  const user = await assertRole(["ADMIN", "TEACHER"]);

  const classRoomId = formData.get("classRoomId") as string;
  const title = formData.get("title") as string;
  const body = (formData.get("body") as string) || null;

  // If teacher, verify they're assigned to this class
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) throw new Error("Teacher record not found");
    const classRoom = await prisma.classRoom.findUnique({ where: { id: classRoomId } });
    if (!classRoom || classRoom.classTeacherId !== teacher.id) {
      // Also allow if they teach a subject in this class
      const subjectTeacher = await prisma.subjectTeacher.findFirst({
        where: { teacher: { userId: user.id }, subject: { classRoomId } },
      });
      if (!subjectTeacher) throw new Error("You are not assigned to this class");
    }
  }

  const note = await prisma.classNote.create({
    data: { classRoomId, authorId: user.id, title, body },
  });

  // Handle file attachments (stored as JSON array in a hidden input)
  const attachmentsRaw = formData.get("attachments") as string;
  if (attachmentsRaw) {
    const attachments = JSON.parse(attachmentsRaw) as { name: string; url: string; mimeType: string }[];
    if (attachments.length > 0) {
      await prisma.noteAttachment.createMany({
        data: attachments.map((a) => ({ noteId: note.id, name: a.name, url: a.url, mimeType: a.mimeType })),
      });
    }
  }

  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const user = await assertRole(["ADMIN", "TEACHER"]);

  const note = await prisma.classNote.findUnique({ where: { id } });
  if (!note) return;

  // Teachers can only delete their own notes
  if (user.role === "TEACHER" && note.authorId !== user.id) {
    throw new Error("You can only delete your own notes");
  }

  await prisma.classNote.delete({ where: { id } });
  revalidatePath("/notes");
}

export async function togglePin(id: string) {
  await assertRole(["ADMIN", "TEACHER"]);
  const note = await prisma.classNote.findUnique({ where: { id } });
  if (!note) return;
  await prisma.classNote.update({ where: { id }, data: { pinned: !note.pinned } });
  revalidatePath("/notes");
}
