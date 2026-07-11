import { requireUser } from "@/lib/rbac";
import { NAV_ITEMS } from "@/lib/nav";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import MobileNav from "@/components/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <Sidebar items={items} user={user} />
      <div className="flex flex-col min-h-screen">
        <Topbar user={user} />
        <main className="flex-1 p-6 lg:p-8 pb-20 lg:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileNav items={items} />
    </div>
  );
}
