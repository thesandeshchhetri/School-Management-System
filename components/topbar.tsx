import Image from "next/image";
import { GraduationCap } from "lucide-react";

export default function Topbar({
  user,
  orgName,
  orgLogo,
}: {
  user: { name?: string | null; role: string; photoUrl?: string | null };
  orgName: string;
  orgLogo?: string | null;
}) {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-surface lg:bg-transparent lg:border-none sticky top-0 z-10">
      <div className="flex items-center gap-2 lg:hidden">
        {orgLogo ? (
          <Image src={orgLogo} alt={orgName} width={28} height={28} className="rounded object-contain" />
        ) : (
          <GraduationCap className="w-5 h-5 text-accent" aria-hidden="true" />
        )}
        <span className="font-display font-bold text-sm">{orgName}</span>
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-accent-soft text-accent px-3 py-1 text-xs font-medium">
          {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
        </span>
        {user.photoUrl ? (
          <Image
            src={user.photoUrl}
            alt={user.name ?? "Profile photo"}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold"
            aria-hidden="true"
          >
            {(user.name ?? "U").slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="sr-only">Signed in as {user.name ?? "user"}</span>
      </div>
    </header>
  );
}
