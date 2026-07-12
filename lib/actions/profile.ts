"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(formData: FormData) {
  const user = await assertRole(["ADMIN", "TEACHER", "STUDENT", "PARENT"]);

  const name = formData.get("name") as string;
  const photoUrl = (formData.get("photoUrl") as string) || null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name ? { name } : {}),
      ...(photoUrl !== null ? { photoUrl } : {}),
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/profile");
}

export async function changePassword(formData: FormData) {
  const user = await assertRole(["ADMIN", "TEACHER", "STUDENT", "PARENT"]);

  const current = formData.get("current") as string;
  const next = formData.get("next") as string;
  const confirm = formData.get("confirm") as string;

  if (next !== confirm) throw new Error("New passwords do not match");
  if (next.length < 6) throw new Error("Password must be at least 6 characters");

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const valid = await import("bcryptjs").then((b) => b.compare(current, dbUser.passwordHash));
  if (!valid) throw new Error("Current password is incorrect");

  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}
