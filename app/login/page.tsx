"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-white p-12 ledger-rule">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-accent" strokeWidth={2} />
          <span className="font-display font-bold text-lg tracking-tight">
            Brightpath
          </span>
        </div>
        <div className="max-w-md">
          <h1 className="font-display text-4xl font-extrabold leading-tight mb-4">
            One register for the whole school.
          </h1>
          <p className="text-white/70 leading-relaxed">
            Students, attendance, grades, fees, and timetables — kept in one
            place, for admins, teachers, students, and parents alike.
          </p>
        </div>
        <p className="text-white/40 text-sm">
          &copy; {new Date().getFullYear()} Brightpath School Manager
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <GraduationCap className="w-6 h-6 text-accent" />
            <span className="font-display font-bold text-lg">Brightpath</span>
          </div>

          <h2 className="font-display text-2xl font-bold mb-1">Sign in</h2>
          <p className="text-ink-soft text-sm mb-8">
            Use the email and password given to you by your school admin.
          </p>

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                placeholder="you@school.edu"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-danger bg-danger-soft rounded-lg px-3.5 py-2.5">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-primary text-white font-medium py-2.5 text-sm hover:bg-primary-soft transition-colors disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-xs text-ink-soft leading-relaxed">
            <p className="font-medium text-ink mb-1">Demo accounts (after seeding):</p>
            <p>Admin: admin@brightpath.edu / admin123</p>
            <p>Teacher: teacher@brightpath.edu / teacher123</p>
            <p>Student: student@brightpath.edu / student123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
