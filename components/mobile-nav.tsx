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
} from "lucide-react";
import type { NavItem } from "@/lib/nav";

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

export default function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // Keep the strip to the 5 most relevant items for this role
  const visible = items.slice(0, 5);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 bg-primary border-t border-white/10 flex justify-around py-2 z-20"
      aria-label="Main navigation"
    >
      {visible.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
              active ? "text-accent" : "text-white/50"
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
