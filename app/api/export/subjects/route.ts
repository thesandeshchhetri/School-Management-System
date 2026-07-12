import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const subjects = await prisma.subject.findMany({
    orderBy: [{ classRoom: { name: "asc" } }, { name: "asc" }],
    include: {
      classRoom: true,
      teachers: { include: { teacher: { include: { user: true } } } },
    },
  });

  const csv = toCSV(
    subjects.map((s) => ({
      name: s.name,
      code: s.code,
      className: s.classRoom?.name ?? "",
      teacher: s.teachers[0]?.teacher.user.name ?? "",
    })),
    [
      { key: "name", label: "Subject Name" },
      { key: "code", label: "Code" },
      { key: "className", label: "Class" },
      { key: "teacher", label: "Teacher" },
    ]
  );

  return csvResponse("subjects.csv", csv);
}
