"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  try {
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
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function changePassword(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  try {
    const user = await assertRole(["ADMIN", "TEACHER", "STUDENT", "PARENT"]);

    const current = formData.get("current") as string;
    const next = formData.get("next") as string;
    const confirm = formData.get("confirm") as string;

    if (next !== confirm) return { error: "New passwords do not match." };
    if (next.length < 6) return { error: "Password must be at least 6 characters." };

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const valid = await bcrypt.compare(current, dbUser.passwordHash);
    if (!valid) return { error: "Current password is incorrect." };

    const passwordHash = await bcrypt.hash(next, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
