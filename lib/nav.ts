import type { Role } from "@/lib/rbac";

export type NavItem = {
  href: string;
  label: string;
  icon: "layout" | "users" | "user-check" | "calendar-check" | "notebook" | "wallet" | "clock" | "school";
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "layout", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/students", label: "Students", icon: "users", roles: ["ADMIN", "TEACHER"] },
  { href: "/teachers", label: "Teachers", icon: "user-check", roles: ["ADMIN"] },
  { href: "/classes", label: "Classes & Subjects", icon: "school", roles: ["ADMIN"] },
  { href: "/attendance", label: "Attendance", icon: "calendar-check", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/exams", label: "Grades & Exams", icon: "notebook", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { href: "/fees", label: "Fees", icon: "wallet", roles: ["ADMIN", "STUDENT", "PARENT"] },
  { href: "/timetable", label: "Timetable", icon: "clock", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
];
