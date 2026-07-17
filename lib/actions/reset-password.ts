"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function adminResetPassword(
  userId: string,
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
) {
  try {
    await assertRole(["ADMIN"]);
    const password = formData.get("password") as string;
    if (!password || password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: true } });
    revalidatePath("/students");
    revalidatePath("/teachers");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
