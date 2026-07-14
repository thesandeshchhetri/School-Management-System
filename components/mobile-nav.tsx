"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Users, UserCheck, CalendarCheck, NotebookText,
  Wallet, Clock, School, Shield, GraduationCap, LogOut, Menu, X, FileText, Heart,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { signOutAction } from "@/app/(app)/actions";

const ICONS = {
  layout: LayoutDashboard,
  users: Users,
  "user-check": UserCheck,
  "calendar-check": CalendarCheck,
  notebook: NotebookText,
  wallet: Wallet,
  clock: Clock,
  school: School,
  shield: Shield,
  "file-text": FileText,
  heart: Heart,
} as const;

export default function MobileNav({
  items,
  user,
  orgName,
  orgLogo,
}: {
  items: NavItem[];
  user: { name?: string | null; role: string; photoUrl?: string | null };
  orgName: string;
  orgLogo?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Pick 4 most relevant items for the bottom quick-bar (excluding superadmin)
  const quickItems = items.filter((i) => i.href !== "/superadmin").slice(0, 4);

  return (
    <>
      {/* ── Bottom quick-bar ─────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 sidebar-gradient border-t border-white/10 z-30"
        aria-label="Quick navigation"
      >
        <div className="flex items-stretch">
          {quickItems.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                  active ? "text-accent" : "text-white/50"
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          {/* Menu button to open the full drawer */}
          <button
            className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-white/50"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── Full drawer ───────────────────────────────────── */}
      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-72 sidebar-gradient text-white z-50 flex flex-col transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            {orgLogo ? (
              <Image src={orgLogo} alt={orgName} width={28} height={28} className="rounded object-contain" />
            ) : (
              <GraduationCap className="w-6 h-6 text-accent" aria-hidden="true" />
            )}
            <span className="font-display font-bold tracking-tight truncate">{orgName}</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5" aria-label="All navigation">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile + sign out */}
        <div className="px-3 py-4 border-t border-white/10 shrink-0">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors mb-1"
            aria-label="My profile"
          >
            {user.photoUrl ? (
              <Image
                src={user.photoUrl}
                alt={user.name ?? ""}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold shrink-0">
                {(user.name ?? "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-white/50">
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()} · Edit profile
              </p>
            </div>
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
