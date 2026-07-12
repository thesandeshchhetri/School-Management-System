import { prisma } from "@/lib/prisma";
import { cache } from "react";

/**
 * The app has exactly one Organization row, holding branding (name, logo)
 * and module on/off toggles. Auto-creates it on first access so there's
 * no separate "run this migration" step for existing deployments.
 *
 * Wrapped in React's cache() so multiple calls within the same request
 * (e.g. layout + page) only hit the database once.
 */
export const getOrganization = cache(async () => {
  const existing = await prisma.organization.findFirst();
  if (existing) return existing;
  return prisma.organization.create({ data: {} });
});

export type ModuleKey = "attendance" | "exams" | "fees" | "timetable" | "classes";

const FLAG_FIELD: Record<ModuleKey, string> = {
  attendance: "attendanceEnabled",
  exams: "examsEnabled",
  fees: "feesEnabled",
  timetable: "timetableEnabled",
  classes: "classesEnabled",
};

export async function isModuleEnabled(module: ModuleKey): Promise<boolean> {
  const org = await getOrganization();
  return Boolean((org as unknown as Record<string, boolean>)[FLAG_FIELD[module]]);
}
