"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] bg-background">
      {/* Left — brand panel with bubbles */}
      <div className="hidden lg:flex flex-col justify-between sidebar-gradient text-white p-12 relative overflow-hidden">
        {/* Floating bubbles */}
        <div className="bubble bubble-1" style={{ width: 280, height: 280, top: -60, left: -60 }} aria-hidden="true" />
        <div className="bubble bubble-2" style={{ width: 200, height: 200, bottom: 120, right: -30 }} aria-hidden="true" />
        <div className="bubble bubble-3" style={{ width: 150, height: 150, bottom: 320, left: 40 }} aria-hidden="true" />
        <div className="bubble" style={{ width: 100, height: 100, top: "40%", right: "20%", background: "radial-gradient(circle,#818CF8,#6366F1)", animationDelay: "-2s" }} aria-hidden="true" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
            <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Brightpath</span>
        </div>

        {/* Headline */}
        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            School Management System
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight mb-5">
            One platform for<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #A5B4FC, #F9A8D4)" }}>
              every school role.
            </span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Students, teachers, parents and admins — all connected through one elegant system.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {["Attendance", "Grades & Exams", "Fee receipts", "Class Notes", "Timetable"].map((f) => (
              <span key={f} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1 text-xs font-medium text-white/80">
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-xs">
          &copy; {new Date().getFullYear()} Brightpath School Manager
        </p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-lg">Brightpath</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-ink mb-1 tracking-tight">Welcome back</h2>
            <p className="text-sm text-ink-soft">Sign in to your school portal</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="you@school.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm" role="alert">
                <span>⚠️</span>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="btn-gradient w-full rounded-xl text-white font-semibold py-3 text-sm disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-8 rounded-2xl border border-border bg-white/50 backdrop-blur-sm p-4 text-xs text-ink-soft space-y-1">
            <p className="font-semibold text-ink mb-1.5">Demo accounts:</p>
            <p>🛡️ Super Admin: admin@yukin.com / Yukin@143!</p>
            <p>⚙️ Admin: admin@brightpath.edu / admin123</p>
            <p>👨‍🏫 Teacher: teacher@brightpath.edu / teacher123</p>
            <p>👩‍🎓 Student: student@brightpath.edu / student123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
