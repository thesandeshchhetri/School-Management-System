"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function markAttendance(formData: FormData) {
  const user = await assertRole(["ADMIN", "TEACHER"]);

  const classRoomId = formData.get("classRoomId") as string;
  const date = formData.get("date") as string;
  const studentIds = formData.getAll("studentId") as string[];

  await Promise.all(
    studentIds.map((studentId) => {
      const status = formData.get(`status-${studentId}`) as string;
      return prisma.attendance.upsert({
        where: { studentId_date: { studentId, date: new Date(date) } },
        create: {
          studentId,
          date: new Date(date),
          status: status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
          markedBy: user.id,
        },
        update: {
          status: status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
          markedBy: user.id,
        },
      });
    })
  );

  revalidatePath(`/attendance?classRoomId=${classRoomId}&date=${date}`);
  revalidatePath("/attendance");
}
