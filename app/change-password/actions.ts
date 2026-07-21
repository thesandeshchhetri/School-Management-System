"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function firstLoginChangePassword(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const newPassword = formData.get("password") as string;
  const confirm     = formData.get("confirm") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (newPassword !== confirm) {
    return { error: "Passwords do not match." };
  }

  const blocked = ["student123", "teacher123", "parent123", "admin123", "password", "12345678"];
  if (blocked.includes(newPassword.toLowerCase())) {
    return { error: "That password is too easy to guess. Please choose a stronger one." };
  }

  if (!existingUser) {
  await signOut({ redirectTo: "/login" });
}
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  return { ok: true };
}
