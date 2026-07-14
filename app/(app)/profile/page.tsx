import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="My Profile" description="Update your photo, name, and password." />
      <ProfileClient
        name={dbUser.name}
        photoUrl={dbUser.photoUrl ?? ""}
        role={dbUser.role}
        isSuperAdmin={dbUser.isSuperAdmin}
      />
    </div>
  );
}
