"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  Shield,
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
    <aside className="hidden lg:flex flex-col bg-primary text-white h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-white/10">
        {orgLogo ? (
          <Image src={orgLogo} alt={orgName} width={28} height={28} className="rounded object-contain shrink-0" />
        ) : (
          <GraduationCap className="w-6 h-6 text-accent shrink-0" aria-hidden="true" />
        )}
        <span className="font-display font-bold tracking-tight truncate">{orgName}</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="My profile"
        >
          {user.photoUrl ? (
            <Image
              src={user.photoUrl}
              alt={user.name ?? ""}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold shrink-0">
              {(user.name ?? "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-white/50 truncate">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </p>
          </div>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
