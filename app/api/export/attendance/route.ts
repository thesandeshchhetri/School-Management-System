import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCSV, csvResponse } from "@/lib/csv";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const classRoomId = req.nextUrl.searchParams.get("classRoomId") ?? undefined;

  let allowedClassRoomIds: string[] | undefined;
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { classesAsTeacher: true },
    });
    allowedClassRoomIds = teacher?.classesAsTeacher.map((c) => c.id) ?? [];
  }

  const records = await prisma.attendance.findMany({
    where: {
      student: {
        classRoomId: classRoomId
          ? classRoomId
          : allowedClassRoomIds
          ? { in: allowedClassRoomIds }
          : undefined,
      },
    },
    orderBy: { date: "desc" },
    include: { student: { include: { classRoom: true } } },
  });

  const csv = toCSV(
    records.map((a) => ({
      student: `${a.student.firstName} ${a.student.lastName}`,
      admissionNo: a.student.admissionNo,
      className: a.student.classRoom?.name ?? "",
      date: a.date,
      status: a.status,
      remarks: a.remarks ?? "",
    })),
    [
      { key: "student", label: "Student" },
      { key: "admissionNo", label: "Admission No" },
      { key: "className", label: "Class" },
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
      { key: "remarks", label: "Remarks" },
    ]
  );

  return csvResponse("attendance.csv", csv);
}
