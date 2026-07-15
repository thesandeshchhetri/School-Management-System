"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function createTeacher(formData: FormData) {
  await assertRole(["ADMIN"]);

  const name    = formData.get("name") as string;
  const email   = (formData.get("email") as string).trim();
  const phone   = (formData.get("phone") as string) || null;
  const subject = (formData.get("subject") as string) || null;
  const password = (formData.get("password") as string) || "teacher123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error(`Email ${email} is already in use.`);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "TEACHER", mustChangePassword: true },
  });
  await prisma.teacher.create({ data: { userId: user.id, phone, subject } });

  revalidatePath("/teachers");
  redirect("/teachers");
}

export async function updateTeacher(
  id: string,
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await assertRole(["ADMIN"]);

    const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
    if (!teacher) return { error: "Teacher not found." };

    const newEmail = (formData.get("email") as string)?.trim();

    if (newEmail && newEmail !== teacher.user.email) {
      const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
      if (conflict && conflict.id !== teacher.user.id) {
        return { error: `Email "${newEmail}" is already in use by another account.` };
      }
      await prisma.user.update({
        where: { id: teacher.user.id },
        data: { name: formData.get("name") as string, email: newEmail },
      });
    } else {
      await prisma.user.update({
        where: { id: teacher.user.id },
        data: { name: formData.get("name") as string },
      });
    }

    await prisma.teacher.update({
      where: { id },
      data: {
        phone:   (formData.get("phone") as string) || null,
        subject: (formData.get("subject") as string) || null,
      },
    });

    revalidatePath("/teachers");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteTeacher(id: string) {
  await assertRole(["ADMIN"]);
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return;
  await prisma.user.delete({ where: { id: teacher.userId } });
  revalidatePath("/teachers");
}
