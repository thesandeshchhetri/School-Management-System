import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csv";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

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

  const defaultPasswordHash = await bcrypt.hash("teacher123", 10);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const name = row["Name"] || row["name"];
    const email = row["Email"] || row["email"];

    if (!name || !email) {
      errors.push(`Row ${i + 2}: missing Name or Email — skipped.`);
      skipped++;
      continue;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      errors.push(`Row ${i + 2}: ${email} already exists — skipped.`);
      skipped++;
      continue;
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash: defaultPasswordHash, role: "TEACHER" },
    });
    await prisma.teacher.create({
      data: {
        userId: user.id,
        subject: row["Subject"] || row["subject"] || null,
        phone: row["Phone"] || row["phone"] || null,
      },
    });
    created++;
  }

  revalidatePath("/teachers");

  return Response.json({ created, skipped, errors });
}
