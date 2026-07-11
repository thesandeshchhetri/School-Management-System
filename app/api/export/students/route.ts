import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const students = await prisma.student.findMany({
    orderBy: { admissionNo: "asc" },
    include: { classRoom: true },
  });

  const csv = toCSV(
    students.map((s) => ({
      admissionNo: s.admissionNo,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.classRoom?.name ?? "",
      gender: s.gender ?? "",
      dateOfBirth: s.dateOfBirth,
      phone: s.phone ?? "",
      address: s.address ?? "",
      enrolledOn: s.enrolledOn,
    })),
    [
      { key: "admissionNo", label: "Admission No" },
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "className", label: "Class" },
      { key: "gender", label: "Gender" },
      { key: "dateOfBirth", label: "Date of Birth" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
      { key: "enrolledOn", label: "Enrolled On" },
    ]
  );

  return csvResponse("students.csv", csv);
}
