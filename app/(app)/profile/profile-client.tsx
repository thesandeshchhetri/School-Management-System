"use client";

import { useActionState, useEffect, useRef } from "react";
import { Card, FormField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { updateProfile, changePassword } from "@/lib/actions/profile";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  name: string;
  photoUrl: string;
  role: string;
  isSuperAdmin: boolean;
};

export default function ProfileClient({ name, photoUrl, role, isSuperAdmin }: Props) {
  const router = useRouter();
  const [profileState, profileAction] = useActionState(updateProfile, undefined);
  const [pwState, pwAction] = useActionState(changePassword, undefined);
  const pwFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (pwState?.ok) pwFormRef.current?.reset();
  }, [pwState]);

  useEffect(() => {
    if (profileState?.ok) router.refresh();
  }, [profileState, router]);

  return (
    <>
      <Card className="p-6">
        <h2 className="font-display font-semibold text-ink mb-4">Profile details</h2>
        <form action={profileAction} className="space-y-5">
          <div className="flex items-start gap-5">
            <ImageUpload
              currentUrl={photoUrl || null}
              name="photoUrl"
              folder="profile-photos"
              shape="circle"
              size={80}
              label="Change photo"
            />
            <div className="flex-1 space-y-4">
              <FormField label="Display name" name="name" defaultValue={name} required />
              <div>
                <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                  {isSuperAdmin ? " · Super Admin" : ""}
                </p>
              </div>
            </div>
          </div>
          <Feedback state={profileState} successMsg="Profile updated!" />
          <SubmitButton>Save changes</SubmitButton>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-display font-semibold text-ink mb-4">Change password</h2>
        <form ref={pwFormRef} action={pwAction} className="space-y-4">
          <FormField label="Current password" name="current" type="password" required />
          <FormField
            label="New password"
            name="next"
            type="password"
            required
            hint="At least 6 characters."
          />
          <FormField label="Confirm new password" name="confirm" type="password" required />
          <Feedback state={pwState} successMsg="Password updated successfully!" />
          <SubmitButton variant="ghost">Update password</SubmitButton>
        </form>
      </Card>
    </>
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
      <p className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3" role="status">
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        {successMsg}
      </p>
    );
  }
  if (state.error) {
    return (
      <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3" role="alert">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        {state.error}
      </p>
    );
  }
  return null;
}
