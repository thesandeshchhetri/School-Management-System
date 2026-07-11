import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const teachers = await prisma.teacher.findMany({
    orderBy: { joinedOn: "desc" },
    include: { user: true },
  });

  const csv = toCSV(
    teachers.map((t) => ({
      name: t.user.name,
      email: t.user.email,
      subject: t.subject ?? "",
      phone: t.phone ?? "",
      joinedOn: t.joinedOn,
    })),
    [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "subject", label: "Subject" },
      { key: "phone", label: "Phone" },
      { key: "joinedOn", label: "Joined On" },
    ]
  );

  return csvResponse("teachers.csv", csv);
}
