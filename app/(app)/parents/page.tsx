import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState, FormField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createParent } from "@/lib/actions/parents";
import { LinkChildButton, UnlinkChildButton, DeleteParentButton } from "./link-buttons";
import { AdminPasswordResetCard } from "@/components/admin-password-reset-card";

export default async function ParentsPage() {
  await requireRole(["ADMIN"]);

  const [parents, unlinkedStudents] = await Promise.all([
    prisma.parent.findMany({
      orderBy: { user: { name: "asc" } },
      include: {
        user: true,
        children: { include: { classRoom: true } },
      },
    }),
    prisma.student.findMany({
      where: { parentId: null },
      orderBy: { firstName: "asc" },
      include: { classRoom: true },
    }),
  ]);

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Parents"
        description="Create parent portal accounts and link them to their children."
      />

      {/* Create parent */}
      <Card className="p-5">
        <h2 className="font-display font-semibold text-primary mb-4">Add parent account</h2>
        <form action={createParent} className="space-y-4" aria-label="Create parent account">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Full name" name="name" required />
            <FormField label="Email (login)" name="email" type="email" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Phone" name="phone" />
            <FormField
              label="Temporary password"
              name="password"
              placeholder="parent123 (default)"
              hint="They should change it after first sign-in."
            />
          </div>
          <SubmitButton>Create parent account</SubmitButton>
        </form>
      </Card>

      {/* Parent list */}
      {parents.length === 0 ? (
        <EmptyState title="No parent accounts yet" description="Add the first one above." />
      ) : (
        <div className="space-y-4">
          {parents.map((parent) => (
            <Card key={parent.id} className="overflow-hidden">
              <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-border">
                <div>
                  <p className="font-medium">{parent.user.name}</p>
                  <p className="text-sm text-ink-soft">{parent.user.email}</p>
                  {parent.phone && <p className="text-xs text-ink-soft">{parent.phone}</p>}
                </div>
                <DeleteParentButton id={parent.id} name={parent.user.name} />
              </div>

              {/* Linked children */}
              <div className="px-5 py-3">
                <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
                  Linked children ({parent.children.length})
                </p>
                {parent.children.length === 0 ? (
                  <p className="text-sm text-ink-soft italic">No children linked yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {parent.children.map((child) => (
                      <li key={child.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm">
                          {child.firstName} {child.lastName}
                          {child.classRoom && (
                            <span className="text-xs text-ink-soft ml-2">({child.classRoom.name})</span>
                          )}
                        </span>
                        <UnlinkChildButton
                          studentId={child.id}
                          studentName={`${child.firstName} ${child.lastName}`}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {/* Link unlinked students */}
                {unlinkedStudents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-ink-soft mb-2">Link a student:</p>
                    <div className="flex flex-wrap gap-2">
                      {unlinkedStudents.map((s) => (
                        <LinkChildButton
                          key={s.id}
                          parentId={parent.id}
                          studentId={s.id}
                          studentName={`${s.firstName} ${s.lastName}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Password reset */}
              <div className="px-5 pb-4">
                <AdminPasswordResetCard userId={parent.user.id} userName={parent.user.name} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
