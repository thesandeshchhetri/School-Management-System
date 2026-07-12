import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPass = await bcrypt.hash("admin123", 10);
  const teacherPass = await bcrypt.hash("teacher123", 10);
  const studentPass = await bcrypt.hash("student123", 10);
  const superAdminPass = await bcrypt.hash("Yukin@143!", 10);

  // --- Organization (branding + module toggles singleton) ---
  const existingOrg = await prisma.organization.findFirst();
  if (!existingOrg) {
    await prisma.organization.create({ data: {} });
  }

  // --- Super Admin ---
  // Full admin rights, plus organization branding and module toggle control.
  await prisma.user.upsert({
    where: { email: "admin@yukin.com" },
    update: { isSuperAdmin: true, role: "ADMIN", passwordHash: superAdminPass },
    create: {
      name: "Yukin Super Admin",
      email: "admin@yukin.com",
      passwordHash: superAdminPass,
      role: "ADMIN",
      isSuperAdmin: true,
    },
  });

  // --- Admin ---
  await prisma.user.upsert({
    where: { email: "admin@brightpath.edu" },
    update: {},
    create: {
      name: "Ava Whitfield",
      email: "admin@brightpath.edu",
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  // --- Teacher ---
  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@brightpath.edu" },
    update: {},
    create: {
      name: "Marcus Lee",
      email: "teacher@brightpath.edu",
      passwordHash: teacherPass,
      role: "TEACHER",
    },
  });
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id, subject: "Mathematics", phone: "555-0101" },
  });

  // --- Class ---
  const classRoom = await prisma.classRoom.upsert({
    where: { name: "Grade 8 - Section A" },
    update: {},
    create: {
      name: "Grade 8 - Section A",
      gradeLevel: 8,
      section: "A",
      capacity: 35,
      classTeacherId: teacher.id,
    },
  });

  // --- Subjects ---
  const math = await prisma.subject.upsert({
    where: { code: "MATH-08" },
    update: {},
    create: { name: "Mathematics", code: "MATH-08", classRoomId: classRoom.id },
  });
  const science = await prisma.subject.upsert({
    where: { code: "SCI-08" },
    update: {},
    create: { name: "Science", code: "SCI-08", classRoomId: classRoom.id },
  });

  await prisma.subjectTeacher.upsert({
    where: { subjectId_teacherId: { subjectId: math.id, teacherId: teacher.id } },
    update: {},
    create: { subjectId: math.id, teacherId: teacher.id },
  });
  await prisma.subjectTeacher.upsert({
    where: { subjectId_teacherId: { subjectId: science.id, teacherId: teacher.id } },
    update: {},
    create: { subjectId: science.id, teacherId: teacher.id },
  });

  // --- Student with portal login ---
  const studentUser = await prisma.user.upsert({
    where: { email: "student@brightpath.edu" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "student@brightpath.edu",
      passwordHash: studentPass,
      role: "STUDENT",
    },
  });

  const student = await prisma.student.upsert({
    where: { admissionNo: "BP-2026-001" },
    update: {},
    create: {
      userId: studentUser.id,
      admissionNo: "BP-2026-001",
      firstName: "Priya",
      lastName: "Sharma",
      gender: "Female",
      classRoomId: classRoom.id,
      dateOfBirth: new Date("2012-04-15"),
    },
  });

  // A couple more students without logins, for a fuller roster
  await prisma.student.upsert({
    where: { admissionNo: "BP-2026-002" },
    update: {},
    create: {
      admissionNo: "BP-2026-002",
      firstName: "Noah",
      lastName: "Kim",
      gender: "Male",
      classRoomId: classRoom.id,
      dateOfBirth: new Date("2012-01-22"),
    },
  });
  await prisma.student.upsert({
    where: { admissionNo: "BP-2026-003" },
    update: {},
    create: {
      admissionNo: "BP-2026-003",
      firstName: "Layla",
      lastName: "Haddad",
      gender: "Female",
      classRoomId: classRoom.id,
      dateOfBirth: new Date("2012-09-03"),
    },
  });

  // --- Attendance (last 5 days) ---
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    await prisma.attendance.upsert({
      where: { studentId_date: { studentId: student.id, date } },
      update: {},
      create: {
        studentId: student.id,
        date,
        status: i === 2 ? "LATE" : "PRESENT",
      },
    });
  }

  // --- Exam + grades ---
  const exam = await prisma.exam.create({
    data: {
      name: "Mid-Term 2026",
      classRoomId: classRoom.id,
      examDate: new Date(),
      maxMarks: 100,
    },
  });

  await prisma.gradeEntry.create({
    data: {
      examId: exam.id,
      studentId: student.id,
      subjectId: math.id,
      marksObtained: 87,
      grade: "A",
    },
  });
  await prisma.gradeEntry.create({
    data: {
      examId: exam.id,
      studentId: student.id,
      subjectId: science.id,
      marksObtained: 74,
      grade: "B",
    },
  });

  // --- Fee invoice ---
  const invoice = await prisma.feeInvoice.create({
    data: {
      studentId: student.id,
      title: "Term 1 Tuition",
      amount: 1200,
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: "PARTIAL",
    },
  });
  await prisma.feePayment.create({
    data: { invoiceId: invoice.id, amount: 500, method: "bank transfer" },
  });

  // --- Timetable ---
  await prisma.timetableSlot.createMany({
    data: [
      {
        classRoomId: classRoom.id,
        subjectId: math.id,
        teacherId: teacher.id,
        day: "MONDAY",
        startTime: "09:00",
        endTime: "09:45",
        room: "Rm 204",
      },
      {
        classRoomId: classRoom.id,
        subjectId: science.id,
        teacherId: teacher.id,
        day: "MONDAY",
        startTime: "10:00",
        endTime: "10:45",
        room: "Lab 1",
      },
      {
        classRoomId: classRoom.id,
        subjectId: math.id,
        teacherId: teacher.id,
        day: "WEDNESDAY",
        startTime: "09:00",
        endTime: "09:45",
        room: "Rm 204",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Super Admin: admin@yukin.com / Yukin@143!");
  console.log("Login with:  admin@brightpath.edu / admin123");
  console.log("             teacher@brightpath.edu / teacher123");
  console.log("             student@brightpath.edu / student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
