"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  NotebookText,
  Wallet,
  Clock,
  School,
  GraduationCap,
  LogOut,
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
} as const;

export default function Sidebar({
  items,
  user,
}: {
  items: NavItem[];
  user: { name?: string | null; email?: string | null; role: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col bg-primary text-white h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-white/10">
        <GraduationCap className="w-6 h-6 text-accent" />
        <span className="font-display font-bold tracking-tight">Brightpath</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-white/50 truncate">
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
