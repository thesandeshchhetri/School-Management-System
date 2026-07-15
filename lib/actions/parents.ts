"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createParent(formData: FormData) {
  await assertRole(["ADMIN"]);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const password = (formData.get("password") as string) || "parent123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error(`${email} already has an account`);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "PARENT", mustChangePassword: true },
  });
  await prisma.parent.create({ data: { userId: user.id, phone } });

  revalidatePath("/parents");
}

export async function deleteParent(id: string) {
  await assertRole(["ADMIN"]);
  const parent = await prisma.parent.findUnique({ where: { id } });
  if (!parent) return;
  // Unlink children first so they aren't deleted
  await prisma.student.updateMany({ where: { parentId: id }, data: { parentId: null } });
  await prisma.user.delete({ where: { id: parent.userId } }); // cascades to parent
  revalidatePath("/parents");
}

export async function linkChild(parentId: string, studentId: string) {
  await assertRole(["ADMIN"]);
  await prisma.student.update({ where: { id: studentId }, data: { parentId } });
  revalidatePath("/parents");
}

export async function unlinkChild(studentId: string) {
  await assertRole(["ADMIN"]);
  await prisma.student.update({ where: { id: studentId }, data: { parentId: null } });
  revalidatePath("/parents");
}
