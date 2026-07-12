"use server";

import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateOrganization(formData: FormData) {
  await assertSuperAdmin();

  const org = await prisma.organization.findFirst();
  if (!org) return;

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      name: (formData.get("name") as string) || org.name,
      address: (formData.get("address") as string) || null,
      logoUrl: (formData.get("logoUrl") as string) || org.logoUrl,
      attendanceEnabled: formData.get("attendanceEnabled") === "on",
      examsEnabled: formData.get("examsEnabled") === "on",
      feesEnabled: formData.get("feesEnabled") === "on",
      timetableEnabled: formData.get("timetableEnabled") === "on",
      classesEnabled: formData.get("classesEnabled") === "on",
      notesEnabled: formData.get("notesEnabled") === "on",
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/superadmin");
}

export async function createAdminUser(formData: FormData) {
  await assertSuperAdmin();

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = (formData.get("password") as string) || "admin123";
  const isSuperAdmin = formData.get("isSuperAdmin") === "on";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error(`User ${email} already exists`);

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN", isSuperAdmin },
  });

  revalidatePath("/superadmin");
}

export async function deleteAdminUser(id: string) {
  const caller = await assertSuperAdmin();
  if (caller.id === id) throw new Error("You cannot delete your own account");
  await prisma.user.delete({ where: { id, role: "ADMIN" } });
  revalidatePath("/superadmin");
}

export async function resetUserPassword(id: string, formData: FormData) {
  await assertSuperAdmin();
  const password = formData.get("password") as string;
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/superadmin");
}
