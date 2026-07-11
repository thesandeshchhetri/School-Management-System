"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { letterGrade } from "@/lib/utils";

export async function createExam(formData: FormData) {
  await assertRole(["ADMIN"]);

  await prisma.exam.create({
    data: {
      name: formData.get("name") as string,
      classRoomId: formData.get("classRoomId") as string,
      examDate: new Date(formData.get("examDate") as string),
      maxMarks: Number(formData.get("maxMarks")) || 100,
    },
  });

  revalidatePath("/exams");
}

export async function deleteExam(id: string) {
  await assertRole(["ADMIN"]);
  await prisma.exam.delete({ where: { id } });
  revalidatePath("/exams");
}

export async function saveGrades(examId: string, formData: FormData) {
  const user = await assertRole(["ADMIN", "TEACHER"]);
  void user;

  const subjectId = formData.get("subjectId") as string;
  const exam = await prisma.exam.findUniqueOrThrow({ where: { id: examId } });
  const studentIds = formData.getAll("studentId") as string[];

  await Promise.all(
    studentIds.map((studentId) => {
      const marksRaw = formData.get(`marks-${studentId}`) as string;
      const marks = marksRaw === "" ? null : Number(marksRaw);
      if (marks === null) return Promise.resolve();

      return prisma.gradeEntry.upsert({
        where: { examId_studentId_subjectId: { examId, studentId, subjectId } },
        create: {
          examId,
          studentId,
          subjectId,
          marksObtained: marks,
          grade: letterGrade(marks, exam.maxMarks),
        },
        update: {
          marksObtained: marks,
          grade: letterGrade(marks, exam.maxMarks),
        },
      });
    })
  );

  revalidatePath(`/exams/${examId}`);
}
