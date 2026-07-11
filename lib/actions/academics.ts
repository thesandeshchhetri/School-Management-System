"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function createClassRoom(formData: FormData) {
  await assertRole(["ADMIN"]);

  await prisma.classRoom.create({
    data: {
      name: formData.get("name") as string,
      gradeLevel: Number(formData.get("gradeLevel")),
      section: (formData.get("section") as string) || null,
      capacity: Number(formData.get("capacity")) || 40,
      classTeacherId: (formData.get("classTeacherId") as string) || null,
    },
  });

  revalidatePath("/classes");
}

export async function deleteClassRoom(id: string) {
  await assertRole(["ADMIN"]);
  await prisma.classRoom.delete({ where: { id } });
  revalidatePath("/classes");
}

export async function createSubject(formData: FormData) {
  await assertRole(["ADMIN"]);

  const subject = await prisma.subject.create({
    data: {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      classRoomId: (formData.get("classRoomId") as string) || null,
    },
  });

  const teacherId = formData.get("teacherId") as string;
  if (teacherId) {
    await prisma.subjectTeacher.create({
      data: { subjectId: subject.id, teacherId },
    });
  }

  revalidatePath("/classes");
}

export async function deleteSubject(id: string) {
  await assertRole(["ADMIN"]);
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/classes");
}
