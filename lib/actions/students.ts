"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function createStudent(
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await assertRole(["ADMIN"]);

    const firstName    = formData.get("firstName") as string;
    const lastName     = formData.get("lastName") as string;
    const admissionNo  = formData.get("admissionNo") as string;
    const classRoomId  = (formData.get("classRoomId") as string) || null;
    const gender       = (formData.get("gender") as string) || null;
    const phone        = (formData.get("phone") as string) || null;
    const dob          = formData.get("dateOfBirth") as string;
    const createLogin  = formData.get("createLogin") === "on";
    const email        = (formData.get("email") as string)?.trim() || null;

    // Check admission number uniqueness
    const dupAdm = await prisma.student.findUnique({ where: { admissionNo } });
    if (dupAdm) return { error: `Admission number "${admissionNo}" is already in use.` };

    let userId: string | undefined;
    if (createLogin && email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return { error: `Email "${email}" is already in use by another account.` };
      const passwordHash = await bcrypt.hash("student123", 10);
      const user = await prisma.user.create({
        data: { name: `${firstName} ${lastName}`, email, passwordHash, role: "STUDENT", mustChangePassword: true },
      });
      userId = user.id;
    }

    await prisma.student.create({
      data: { firstName, lastName, admissionNo, classRoomId, gender, phone,
        dateOfBirth: dob ? new Date(dob) : null, userId },
    });

    revalidatePath("/students");
    redirect("/students");
  } catch (e) {
    // redirect() throws internally — re-throw it
    if ((e as Error).message === "NEXT_REDIRECT") throw e;
    return { error: (e as Error).message };
  }
}

/** Returns { ok, error } so the edit page can show inline feedback without a crash page. */
export async function updateStudent(
  id: string,
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await assertRole(["ADMIN"]);

    const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
    if (!student) return { error: "Student not found." };

    const newEmail = (formData.get("email") as string)?.trim();

    if (student.user) {
      // Existing login — update email if changed
      if (newEmail && newEmail !== student.user.email) {
        const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
        if (conflict && conflict.id !== student.user.id) {
          return { error: `Email "${newEmail}" is already in use by another account.` };
        }
        await prisma.user.update({
          where: { id: student.user.id },
          data: { email: newEmail, name: `${formData.get("firstName")} ${formData.get("lastName")}` },
        });
      } else {
        // Still update the display name in case first/last changed
        await prisma.user.update({
          where: { id: student.user.id },
          data: { name: `${formData.get("firstName")} ${formData.get("lastName")}` },
        });
      }
    } else if (newEmail) {
      // No existing login — create one now
      const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
      if (conflict) {
        return { error: `Email "${newEmail}" is already in use by another account.` };
      }
      const firstName = formData.get("firstName") as string;
      const lastName  = formData.get("lastName") as string;
      const passwordHash = await bcrypt.hash("student123", 10);
      const newUser = await prisma.user.create({
        data: { name: `${firstName} ${lastName}`, email: newEmail, passwordHash, role: "STUDENT", mustChangePassword: true },
      });
      await prisma.student.update({ where: { id }, data: { userId: newUser.id } });
    }

    await prisma.student.update({
      where: { id },
      data: {
        firstName:   formData.get("firstName") as string,
        lastName:    formData.get("lastName") as string,
        admissionNo: formData.get("admissionNo") as string,
        classRoomId: (formData.get("classRoomId") as string) || null,
        gender:      (formData.get("gender") as string) || null,
        phone:       (formData.get("phone") as string) || null,
        dateOfBirth: formData.get("dateOfBirth")
          ? new Date(formData.get("dateOfBirth") as string)
          : null,
      },
    });

    revalidatePath("/students");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteStudent(id: string) {
  await assertRole(["ADMIN"]);
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
}
