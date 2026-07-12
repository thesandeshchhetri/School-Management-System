import { requireUser } from "@/lib/rbac";
import { NAV_ITEMS } from "@/lib/nav";
import { getOrganization } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import MobileNav from "@/components/mobile-nav";

// Map nav href → org flag field name
const MODULE_FLAGS: Record<string, string> = {
  "/attendance": "attendanceEnabled",
  "/exams": "examsEnabled",
  "/fees": "feesEnabled",
  "/timetable": "timetableEnabled",
  "/classes": "classesEnabled",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, org] = await Promise.all([requireUser(), getOrganization()]);
  const orgFlags = org as unknown as Record<string, boolean>;

  const items = NAV_ITEMS.filter((item) => {
    // Role check
    if (!item.roles.includes(user.role)) return false;
    // SuperAdmin-only items
    if (item.superAdminOnly && !user.isSuperAdmin) return false;
    // Module toggle check (skip if no flag)
    const flagKey = MODULE_FLAGS[item.href];
    if (flagKey && !orgFlags[flagKey]) return false;
    return true;
  });

  // Fetch user photoUrl if available
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { photoUrl: true },
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar
        items={items}
        user={{ ...user, photoUrl: dbUser?.photoUrl }}
        orgName={org.name}
        orgLogo={org.logoUrl}
      />
      <div className="flex flex-col min-h-screen">
        <Topbar
          user={{ ...user, photoUrl: dbUser?.photoUrl }}
          orgName={org.name}
          orgLogo={org.logoUrl}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-6 lg:p-8 pb-20 lg:pb-8 max-w-6xl w-full mx-auto"
        >
          {children}
        </main>
      </div>
      <MobileNav
        items={items}
        user={{ ...user, photoUrl: dbUser?.photoUrl }}
        orgName={org.name}
        orgLogo={org.logoUrl}
      />
    </div>
  );
}
