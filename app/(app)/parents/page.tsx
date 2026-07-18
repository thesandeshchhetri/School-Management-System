import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, FormField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createParent } from "@/lib/actions/parents";
import ParentsList from "./parents-list";

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
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Parents"
        description="Create parent portal accounts and link them to their children."
      />

      <Card className="p-5">
        <h2 className="font-display font-semibold text-ink mb-4 text-sm">Add parent account</h2>
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
              hint="They must change it after first sign-in."
            />
          </div>
          <SubmitButton>Create parent account</SubmitButton>
        </form>
      </Card>

      <ParentsList
        parents={parents.map((p) => ({
          id: p.id,
          phone: p.phone,
          user: { id: p.user.id, name: p.user.name, email: p.user.email },
          children: p.children.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            classRoom: c.classRoom ? { name: c.classRoom.name } : null,
          })),
        }))}
        unlinkedStudents={unlinkedStudents.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          classRoom: s.classRoom ? { name: s.classRoom.name } : null,
        }))}
      />
    </div>
  );
}
