import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

/** Get the current session or redirect to /login. Use in server components/pages. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Get the current session and ensure the role is one of `roles`, else redirect to /dashboard. */
export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/** For use inside server actions: throws instead of redirecting. */
export async function assertRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (!roles.includes(session.user.role)) throw new Error("Not authorized");
  return session.user;
}
