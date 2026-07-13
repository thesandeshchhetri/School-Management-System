import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csv";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return Response.json({ error: "The CSV file has no rows" }, { status: 400 });
  }

  const classRooms = await prisma.classRoom.findMany();
  const classByName = new Map<string, string>(classRooms.map((c) => [c.name.toLowerCase(), c.id]));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const admissionNo = row["Admission No"] || row["admissionNo"];
    const firstName = row["First Name"] || row["firstName"];
    const lastName = row["Last Name"] || row["lastName"];

    if (!admissionNo || !firstName || !lastName) {
      errors.push(`Row ${i + 2}: missing Admission No, First Name, or Last Name — skipped.`);
      continue;
    }

    const classNameRaw = row["Class"] || row["className"] || "";
    const classRoomId = classNameRaw ? classByName.get(classNameRaw.toLowerCase()) : undefined;
    if (classNameRaw && !classRoomId) {
      errors.push(`Row ${i + 2}: class "${classNameRaw}" not found — left unassigned.`);
    }

    const dobRaw = row["Date of Birth"] || row["dateOfBirth"];
    const dob = dobRaw && !isNaN(Date.parse(dobRaw)) ? new Date(dobRaw) : null;

    const existing = await prisma.student.findUnique({ where: { admissionNo } });

    if (existing) {
      await prisma.student.update({
        where: { admissionNo },
        data: {
          firstName,
          lastName,
          classRoomId: classRoomId ?? existing.classRoomId,
          gender: row["Gender"] || row["gender"] || existing.gender,
          dateOfBirth: dob ?? existing.dateOfBirth,
          phone: row["Phone"] || row["phone"] || existing.phone,
          address: row["Address"] || row["address"] || existing.address,
        },
      });
      updated++;
    } else {
      await prisma.student.create({
        data: {
          admissionNo,
          firstName,
          lastName,
          classRoomId: classRoomId ?? null,
          gender: row["Gender"] || row["gender"] || null,
          dateOfBirth: dob,
          phone: row["Phone"] || row["phone"] || null,
          address: row["Address"] || row["address"] || null,
        },
      });
      created++;
    }
  }

  revalidatePath("/students");

  return Response.json({ created, updated, errors });
}
