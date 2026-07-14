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
  const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase();

  const rolePill: Record<string, string> = {
    Admin:   "bg-indigo-100 text-indigo-700",
    Teacher: "bg-teal-soft text-teal",
    Student: "bg-pink-100 text-pink-700",
    Parent:  "bg-amber-100 text-amber-700",
  };

  return (
    <header className="flex items-center justify-between h-16 px-5 border-b border-border/60 bg-white/70 backdrop-blur-md lg:bg-transparent lg:border-none sticky top-0 z-10">
      {/* Mobile brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          {orgLogo ? (
            <Image src={orgLogo} alt={orgName} width={18} height={18} className="object-contain" />
          ) : (
            <GraduationCap className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          )}
        </div>
        <span className="font-display font-bold text-sm text-ink">{orgName}</span>
      </div>

      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className={`badge-pill text-xs font-semibold ${rolePill[roleLabel] ?? "bg-gray-100 text-gray-600"}`}>
          {roleLabel}
        </span>

        {user.photoUrl ? (
          <Image
            src={user.photoUrl}
            alt={user.name ?? "Profile photo"}
            width={34}
            height={34}
            className="w-8.5 h-8.5 rounded-xl object-cover ring-2 ring-border"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold shadow-sm"
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
