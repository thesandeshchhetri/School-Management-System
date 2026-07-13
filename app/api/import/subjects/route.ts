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

  // Build lookup maps (case-insensitive)
  const [classRooms, teachers] = await Promise.all([
    prisma.classRoom.findMany(),
    prisma.teacher.findMany({ include: { user: true } }),
  ]);

  const classByName = new Map<string, string>(classRooms.map((c) => [c.name.toLowerCase(), c.id]));
  const teacherByName = new Map<string, string>(teachers.map((t) => [t.user.name.toLowerCase(), t.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;

    // Accept both export header names and lowercase variants
    const name       = (row["Subject Name"] || row["name"]        || row["subject"] || "").trim();
    const code       = (row["Code"]         || row["code"]                          || "").trim();
    const classRaw   = (row["Class"]        || row["class"]       || row["className"] || "").trim();
    const teacherRaw = (row["Teacher"]      || row["teacher"]                       || "").trim();

    if (!name || !code) {
      errors.push(`Row ${rowNum}: missing Subject Name or Code — skipped.`);
      skipped++;
      continue;
    }

    // Resolve optional class
    let classRoomId: string | null = null;
    if (classRaw) {
      const found = classByName.get(classRaw.toLowerCase());
      if (!found) {
        errors.push(`Row ${rowNum}: class "${classRaw}" not found — subject will be unassigned to a class.`);
      } else {
        classRoomId = found;
      }
    }

    // Resolve optional teacher
    let teacherId: string | null = null;
    if (teacherRaw) {
      const found = teacherByName.get(teacherRaw.toLowerCase());
      if (!found) {
        errors.push(`Row ${rowNum}: teacher "${teacherRaw}" not found — subject will be unassigned to a teacher.`);
      } else {
        teacherId = found;
      }
    }

    // Upsert subject by code
    const existing = await prisma.subject.findUnique({ where: { code } });

    if (existing) {
      await prisma.subject.update({
        where: { code },
        data: {
          name,
          classRoomId,
        },
      });

      // Update teacher assignment if provided
      if (teacherId) {
        await prisma.subjectTeacher.upsert({
          where: { subjectId_teacherId: { subjectId: existing.id, teacherId } },
          create: { subjectId: existing.id, teacherId },
          update: {},
        });
      }

      updated++;
    } else {
      const subject = await prisma.subject.create({
        data: { name, code, classRoomId },
      });

      if (teacherId) {
        await prisma.subjectTeacher.create({
          data: { subjectId: subject.id, teacherId },
        });
      }

      created++;
    }
  }

  revalidatePath("/classes");
  return Response.json({ created, updated, skipped, errors });
}
