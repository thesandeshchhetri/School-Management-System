"use client";

import { useActionState, useEffect, useRef } from "react";
import { PageHeader, Card, FormField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { updateProfile, changePassword } from "@/lib/actions/profile";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

// Profile page is client-driven so we can show toast-style success/error
// without needing a redirect.
export default function ProfilePage() {
  const router = useRouter();

  const [profileState, profileAction] = useActionState(updateProfile, undefined);
  const [pwState, pwAction] = useActionState(changePassword, undefined);
  const pwFormRef = useRef<HTMLFormElement>(null);

  // Clear password form on success
  useEffect(() => {
    if (pwState?.ok) {
      pwFormRef.current?.reset();
    }
  }, [pwState]);

  // Refresh layout (updates sidebar photo) on profile save
  useEffect(() => {
    if (profileState?.ok) {
      router.refresh();
    }
  }, [profileState, router]);

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="My Profile" description="Update your photo, name, and password." />

      {/* Photo & name */}
      <Card className="p-6">
        <h2 className="font-display font-semibold text-primary mb-4">Profile details</h2>
        <form action={profileAction} className="space-y-5">
          <div className="flex items-start gap-5">
            <ImageUpload
              name="photoUrl"
              folder="profile-photos"
              shape="circle"
              size={80}
              label="Change photo"
            />
            <div className="flex-1 space-y-4">
              <FormField label="Display name" name="name" required />
            </div>
          </div>

          <Feedback state={profileState} successMsg="Profile updated!" />
          <SubmitButton>Save changes</SubmitButton>
        </form>
      </Card>

      {/* Password */}
      <Card className="p-6">
        <h2 className="font-display font-semibold text-primary mb-4">Change password</h2>
        <form ref={pwFormRef} action={pwAction} className="space-y-4">
          <FormField label="Current password" name="current" type="password" required />
          <FormField label="New password" name="next" type="password" required hint="At least 6 characters." />
          <FormField label="Confirm new password" name="confirm" type="password" required />
          <Feedback state={pwState} successMsg="Password updated successfully!" />
          <SubmitButton variant="ghost">Update password</SubmitButton>
        </form>
      </Card>
    </div>
  );
}

function Feedback({
  state,
  successMsg,
}: {
  state: { ok?: boolean; error?: string } | undefined;
  successMsg: string;
}) {
  if (!state) return null;
  if (state.ok) {
    return (
      <p className="flex items-center gap-2 text-sm text-success bg-success-soft rounded-lg px-3.5 py-2.5" role="status">
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        {successMsg}
      </p>
    );
  }
  if (state.error) {
    return (
      <p className="flex items-center gap-2 text-sm text-danger bg-danger-soft rounded-lg px-3.5 py-2.5" role="alert">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        {state.error}
      </p>
    );
  }
  return null;
}
