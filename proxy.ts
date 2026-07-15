import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const mustChange = req.auth?.user?.mustChangePassword ?? false;

  const isLoginPage     = pathname === "/login";
  const isChangePwPage  = pathname === "/change-password";
  const isPublicApi     = pathname.startsWith("/api/auth");

  if (isPublicApi) return NextResponse.next();

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(
      new URL(mustChange ? "/change-password" : "/dashboard", req.nextUrl.origin)
    );
  }

  // Logged in but must change password — only /change-password is allowed
  if (isLoggedIn && mustChange && !isChangePwPage) {
    return NextResponse.redirect(new URL("/change-password", req.nextUrl.origin));
  }

  // Password is fine — don't let them revisit the change-password page
  if (isLoggedIn && !mustChange && isChangePwPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
