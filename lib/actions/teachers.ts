"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function createTeacher(formData: FormData) {
  await assertRole(["ADMIN"]);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const subject = (formData.get("subject") as string) || null;
  const password = (formData.get("password") as string) || "teacher123";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "TEACHER" },
  });

  await prisma.teacher.create({
    data: { userId: user.id, phone, subject },
  });

  revalidatePath("/teachers");
  redirect("/teachers");
}

export async function updateTeacher(id: string, formData: FormData) {
  await assertRole(["ADMIN"]);

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) throw new Error("Teacher not found");

  await prisma.user.update({
    where: { id: teacher.userId },
    data: { name: formData.get("name") as string },
  });

  await prisma.teacher.update({
    where: { id },
    data: {
      phone: (formData.get("phone") as string) || null,
      subject: (formData.get("subject") as string) || null,
    },
  });

  revalidatePath("/teachers");
  redirect("/teachers");
}

export async function deleteTeacher(id: string) {
  await assertRole(["ADMIN"]);
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return;
  await prisma.user.delete({ where: { id: teacher.userId } }); // cascades to teacher
  revalidatePath("/teachers");
}
