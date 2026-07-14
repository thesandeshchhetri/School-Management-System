"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Users, UserCheck, CalendarCheck, NotebookText,
  Wallet, Clock, School, GraduationCap, LogOut, Shield, FileText, Heart,
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

export default function Sidebar({
  items,
  user,
  orgName,
  orgLogo,
}: {
  items: NavItem[];
  user: { name?: string | null; email?: string | null; role: string; photoUrl?: string | null };
  orgName: string;
  orgLogo?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col sidebar-gradient text-white h-screen sticky top-0 overflow-hidden">
      {/* Floating bubble decorations */}
      <div className="bubble bubble-1" aria-hidden="true" />
      <div className="bubble bubble-2" aria-hidden="true" />
      <div className="bubble bubble-3" aria-hidden="true" />

      {/* Logo / School name */}
      <div className="relative flex items-center gap-3 px-6 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
          {orgLogo ? (
            <Image src={orgLogo} alt={orgName} width={24} height={24} className="rounded-lg object-contain" />
          ) : (
            <GraduationCap className="w-4.5 h-4.5 text-white" aria-hidden="true" />
          )}
        </div>
        <span className="font-display font-bold tracking-tight truncate text-sm">{orgName}</span>
      </div>

      {/* Nav links */}
      <nav className="relative flex-1 px-3 py-5 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "nav-active text-white"
                  : "text-white/55 hover:text-white hover:bg-white/8"
              }`}
            >
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                active ? "bg-white/20" : "group-hover:bg-white/10"
              }`}>
                <Icon className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="relative px-3 py-4 border-t border-white/10">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/8 transition-all mb-1 group"
          aria-label="My profile"
        >
          {user.photoUrl ? (
            <Image
              src={user.photoUrl}
              alt={user.name ?? ""}
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl object-cover shrink-0 ring-2 ring-white/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
              {(user.name ?? "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{user.name}</p>
            <p className="text-xs text-white/45 truncate capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 hover:text-white hover:bg-white/8 transition-all"
          >
            <span className="flex items-center justify-center w-7 h-7">
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </span>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
