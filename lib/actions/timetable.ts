"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function createTimetableSlot(formData: FormData) {
  await assertRole(["ADMIN"]);

  await prisma.timetableSlot.create({
    data: {
      classRoomId: formData.get("classRoomId") as string,
      subjectId: formData.get("subjectId") as string,
      teacherId: formData.get("teacherId") as string,
      day: formData.get("day") as
        | "MONDAY"
        | "TUESDAY"
        | "WEDNESDAY"
        | "THURSDAY"
        | "FRIDAY"
        | "SATURDAY"
        | "SUNDAY",
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      room: (formData.get("room") as string) || null,
    },
  });

  revalidatePath("/timetable");
}

export async function deleteTimetableSlot(id: string) {
  await assertRole(["ADMIN"]);
  await prisma.timetableSlot.delete({ where: { id } });
  revalidatePath("/timetable");
}
