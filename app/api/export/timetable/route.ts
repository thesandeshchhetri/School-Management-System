import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCSV, csvResponse } from "@/lib/csv";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Forbidden", { status: 403 });
  }

  const classRoomId = req.nextUrl.searchParams.get("classRoomId") ?? undefined;

  const slots = await prisma.timetableSlot.findMany({
    where: classRoomId ? { classRoomId } : undefined,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
    include: { classRoom: true, subject: true, teacher: { include: { user: true } } },
  });

  const csv = toCSV(
    slots.map((s) => ({
      className: s.classRoom.name,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject.name,
      teacher: s.teacher.user.name,
      room: s.room ?? "",
    })),
    [
      { key: "className", label: "Class" },
      { key: "day", label: "Day" },
      { key: "startTime", label: "Start" },
      { key: "endTime", label: "End" },
      { key: "subject", label: "Subject" },
      { key: "teacher", label: "Teacher" },
      { key: "room", label: "Room" },
    ]
  );

  return csvResponse("timetable.csv", csv);
}
