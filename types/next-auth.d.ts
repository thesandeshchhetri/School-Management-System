import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
    isSuperAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
    id: string;
    isSuperAdmin: boolean;
  }
}
