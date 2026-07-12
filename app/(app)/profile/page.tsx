import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, FormField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { updateProfile, changePassword } from "@/lib/actions/profile";

export default async function ProfilePage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="My Profile" description="Update your photo, name, and password." />

      {/* Photo & name */}
      <Card className="p-6">
        <form action={updateProfile} className="space-y-5">
          <div className="flex items-start gap-5">
            <ImageUpload
              currentUrl={dbUser.photoUrl}
              name="photoUrl"
              folder="profile-photos"
              shape="circle"
              size={80}
              label="Change photo"
            />
            <div className="flex-1 space-y-4">
              <FormField label="Display name" name="name" defaultValue={dbUser.name} required />
              <div>
                <p className="text-sm text-ink-soft">{dbUser.email}</p>
                <p className="text-xs text-ink-soft mt-0.5 capitalize">
                  {dbUser.role.toLowerCase()}{dbUser.isSuperAdmin ? " · Super Admin" : ""}
                </p>
              </div>
            </div>
          </div>
          <SubmitButton>Save changes</SubmitButton>
        </form>
      </Card>

      {/* Password change */}
      <Card className="p-6">
        <h2 className="font-display font-semibold text-primary mb-4">Change password</h2>
        <form action={changePassword} className="space-y-4">
          <FormField label="Current password" name="current" type="password" required />
          <FormField label="New password" name="next" type="password" required hint="At least 6 characters." />
          <FormField label="Confirm new password" name="confirm" type="password" required />
          <SubmitButton variant="ghost">Update password</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
