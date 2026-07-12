import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csv";
import { revalidatePath } from "next/cache";

const VALID_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function normaliseDay(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  // Accept full names and 3-letter abbreviations (MON, TUE …)
  const found = VALID_DAYS.find(
    (d) => d === upper || d.startsWith(upper.slice(0, 3))
  );
  return found ?? null;
}

function normaliseTime(raw: string): string | null {
  // Accept "09:00", "9:00", "09:00:00", "9:00 AM", "09.00"
  const cleaned = raw.trim().replace(".", ":").replace(/\s?(AM|PM)$/i, "");
  const match = cleaned.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = match[1].padStart(2, "0");
  const m = match[2];
  return `${h}:${m}`;
}

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
  const [classRooms, subjects, teachers] = await Promise.all([
    prisma.classRoom.findMany(),
    prisma.subject.findMany(),
    prisma.teacher.findMany({ include: { user: true } }),
  ]);

  const classByName = new Map(classRooms.map((c) => [c.name.toLowerCase(), c.id]));
  const subjectByName = new Map(subjects.map((s) => [s.name.toLowerCase(), s.id]));
  const subjectByCode = new Map(subjects.map((s) => [s.code.toLowerCase(), s.id]));
  const teacherByName = new Map(teachers.map((t) => [t.user.name.toLowerCase(), t.id]));

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;

    // Accept both export header names and lowercase variants
    const className  = (row["Class"]    || row["class"]    || "").trim();
    const dayRaw     = (row["Day"]      || row["day"]      || "").trim();
    const startRaw   = (row["Start"]    || row["start"]    || row["Start Time"] || row["startTime"] || "").trim();
    const endRaw     = (row["End"]      || row["end"]      || row["End Time"]   || row["endTime"]   || "").trim();
    const subjectRaw = (row["Subject"]  || row["subject"]  || "").trim();
    const teacherRaw = (row["Teacher"]  || row["teacher"]  || "").trim();
    const room       = (row["Room"]     || row["room"]     || "").trim() || null;

    // Required field checks
    if (!className || !dayRaw || !startRaw || !endRaw || !subjectRaw || !teacherRaw) {
      errors.push(`Row ${rowNum}: missing required field(s) — skipped.`);
      skipped++;
      continue;
    }

    const classRoomId = classByName.get(className.toLowerCase());
    if (!classRoomId) {
      errors.push(`Row ${rowNum}: class "${className}" not found — skipped.`);
      skipped++;
      continue;
    }

    const subjectId =
      subjectByName.get(subjectRaw.toLowerCase()) ??
      subjectByCode.get(subjectRaw.toLowerCase());
    if (!subjectId) {
      errors.push(`Row ${rowNum}: subject "${subjectRaw}" not found — skipped.`);
      skipped++;
      continue;
    }

    const teacherId = teacherByName.get(teacherRaw.toLowerCase());
    if (!teacherId) {
      errors.push(`Row ${rowNum}: teacher "${teacherRaw}" not found — skipped.`);
      skipped++;
      continue;
    }

    const day = normaliseDay(dayRaw);
    if (!day) {
      errors.push(`Row ${rowNum}: invalid day "${dayRaw}" — use Monday/Tuesday/… or Mon/Tue/… — skipped.`);
      skipped++;
      continue;
    }

    const startTime = normaliseTime(startRaw);
    const endTime   = normaliseTime(endRaw);
    if (!startTime || !endTime) {
      errors.push(`Row ${rowNum}: invalid time format "${startRaw}" or "${endRaw}" — use HH:MM — skipped.`);
      skipped++;
      continue;
    }

    // Skip exact duplicates (same class + day + start + subject)
    const existing = await prisma.timetableSlot.findFirst({
      where: { classRoomId, day: day as "MONDAY", startTime, subjectId },
    });
    if (existing) {
      errors.push(`Row ${rowNum}: slot already exists (${className} ${day} ${startTime} ${subjectRaw}) — skipped.`);
      skipped++;
      continue;
    }

    await prisma.timetableSlot.create({
      data: {
        classRoomId,
        subjectId,
        teacherId,
        day: day as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
        startTime,
        endTime,
        room,
      },
    });
    created++;
  }

  revalidatePath("/timetable");
  return Response.json({ created, skipped, errors });
}
