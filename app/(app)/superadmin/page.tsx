import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/org";
import {
  PageHeader,
  Card,
  Badge,
  FormField,
  FormSelect,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { updateOrganization, createAdminUser, resetUserPassword } from "@/lib/actions/superadmin";
import DeleteAdminButton from "./delete-admin-button";
import Image from "next/image";

export default async function SuperAdminPage() {
  const me = await requireSuperAdmin();
  const [org, admins] = await Promise.all([
    getOrganization(),
    prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Super Admin"
        description="Organization branding, module visibility, and admin account management."
      />

      {/* ── Branding ────────────────────────────────────────── */}
      <section aria-labelledby="branding-heading">
        <h2 id="branding-heading" className="font-display font-semibold text-primary mb-3">
          Organization branding
        </h2>
        <Card className="p-6">
          <form action={updateOrganization} className="space-y-5">
            <div className="flex items-start gap-6">
              <div>
                <p className="text-sm font-medium text-ink mb-1.5">Logo</p>
                <ImageUpload
                  currentUrl={org.logoUrl}
                  name="logoUrl"
                  folder="org-logos"
                  shape="square"
                  size={96}
                  label="Upload logo"
                />
              </div>
              <div className="flex-1 space-y-4">
                <FormField
                  label="Organization name"
                  name="name"
                  defaultValue={org.name}
                  required
                />
                <FormField
                  label="Address (appears on fee receipts)"
                  name="address"
                  defaultValue={org.address ?? ""}
                />
              </div>
            </div>

            {/* Module toggles */}
            <div className="border-t border-border pt-5">
              <p className="text-sm font-medium text-ink mb-3">
                Module visibility
                <span className="ml-2 text-xs text-ink-soft font-normal">
                  Hidden modules disappear from all users&apos; navigation instantly.
                </span>
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: "attendanceEnabled", label: "Attendance" },
                  { key: "examsEnabled", label: "Grades & Exams" },
                  { key: "feesEnabled", label: "Fees" },
                  { key: "timetableEnabled", label: "Timetable" },
                  { key: "classesEnabled", label: "Classes & Subjects" },
                  { key: "notesEnabled", label: "Class Notes" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-background"
                  >
                    <input
                      type="checkbox"
                      name={key}
                      defaultChecked={(org as unknown as Record<string, boolean>)[key]}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton>Save organization settings</SubmitButton>
            </div>
          </form>
        </Card>
      </section>

      {/* ── Admin accounts ───────────────────────────────────── */}
      <section aria-labelledby="admins-heading">
        <h2 id="admins-heading" className="font-display font-semibold text-primary mb-3">
          Admin accounts
        </h2>

        {/* Create new admin */}
        <Card className="p-5 mb-4">
          <form action={createAdminUser} className="space-y-4" aria-label="Create admin account">
            <p className="text-sm font-medium text-ink">Create new admin</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <FormField label="Name" name="name" required />
              <FormField label="Email" name="email" type="email" required />
              <FormField
                label="Password"
                name="password"
                placeholder="admin123 (default)"
                hint="Must be at least 6 characters."
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isSuperAdmin" className="rounded" />
              Grant super admin access (can change branding &amp; module settings)
            </label>
            <SubmitButton variant="ghost">Create admin</SubmitButton>
          </form>
        </Card>

        {/* Admin list */}
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Admin accounts</caption>
            <thead>
              <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                <th scope="col" className="px-5 py-3 font-medium">Name</th>
                <th scope="col" className="px-5 py-3 font-medium">Email</th>
                <th scope="col" className="px-5 py-3 font-medium">Level</th>
                <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3 font-medium">{a.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{a.email}</td>
                  <td className="px-5 py-3">
                    {a.isSuperAdmin ? (
                      <Badge tone="accent">Super Admin</Badge>
                    ) : (
                      <Badge tone="neutral">Admin</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Reset password inline form */}
                      <form
                        action={resetUserPassword.bind(null, a.id)}
                        className="flex items-center gap-1"
                        aria-label={`Reset password for ${a.name}`}
                      >
                        <input
                          type="text"
                          name="password"
                          placeholder="New password"
                          className="input w-32 text-xs py-1"
                          minLength={6}
                          required
                        />
                        <SubmitButton variant="ghost" className="text-xs py-1 px-2">
                          Reset
                        </SubmitButton>
                      </form>
                      {a.id !== me.id && (
                        <DeleteAdminButton id={a.id} name={a.name} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
