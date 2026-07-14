"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function createStudent(formData: FormData) {
  await assertRole(["ADMIN"]);

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const admissionNo = formData.get("admissionNo") as string;
  const classRoomId = (formData.get("classRoomId") as string) || null;
  const gender = (formData.get("gender") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const dob = formData.get("dateOfBirth") as string;
  const createLogin = formData.get("createLogin") === "on";
  const email = (formData.get("email") as string) || null;

  let userId: string | undefined;
  if (createLogin && email) {
    const passwordHash = await bcrypt.hash("student123", 10);
    const user = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        passwordHash,
        role: "STUDENT",
      },
    });
    userId = user.id;
  }

  await prisma.student.create({
    data: {
      firstName,
      lastName,
      admissionNo,
      classRoomId,
      gender,
      phone,
      dateOfBirth: dob ? new Date(dob) : null,
      userId,
    },
  });

  revalidatePath("/students");
  redirect("/students");
}

export async function updateStudent(id: string, formData: FormData) {
  await assertRole(["ADMIN"]);

  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!student) throw new Error("Student not found");

  // Update portal login email if one exists and email field was provided
  const newEmail = (formData.get("email") as string)?.trim();
  if (student.user && newEmail && newEmail !== student.user.email) {
    const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
    if (conflict && conflict.id !== student.user.id) {
      throw new Error(`Email ${newEmail} is already in use by another account.`);
    }
    await prisma.user.update({ where: { id: student.user.id }, data: { email: newEmail } });
  }

  await prisma.student.update({
    where: { id },
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      admissionNo: formData.get("admissionNo") as string,
      classRoomId: (formData.get("classRoomId") as string) || null,
      gender: (formData.get("gender") as string) || null,
      phone: (formData.get("phone") as string) || null,
      dateOfBirth: formData.get("dateOfBirth")
        ? new Date(formData.get("dateOfBirth") as string)
        : null,
    },
  });

  revalidatePath("/students");
  redirect("/students");
}

export async function deleteStudent(id: string) {
  await assertRole(["ADMIN"]);
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
}
