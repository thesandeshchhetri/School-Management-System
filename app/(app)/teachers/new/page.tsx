import { requireRole } from "@/lib/rbac";
import { PageHeader, Card, Button, FormField } from "@/components/ui";
import { createTeacher } from "@/lib/actions/teachers";

export default async function NewTeacherPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add teacher" description="Invite a new staff member." />
      <Card className="p-6">
        <form action={createTeacher} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Full name" name="name" required />
            <FormField label="Email (login)" name="email" type="email" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Primary subject" name="subject" placeholder="e.g. Mathematics" />
            <FormField label="Phone" name="phone" />
          </div>
          <FormField
            label="Temporary password"
            name="password"
            placeholder="teacher123 (default)"
            hint="They should change this after first sign-in."
          />
          <div className="pt-2">
            <Button type="submit">Save teacher</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
