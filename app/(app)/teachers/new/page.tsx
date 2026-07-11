import { requireRole } from "@/lib/rbac";
import { PageHeader, Card, Button } from "@/components/ui";
import { createTeacher } from "@/lib/actions/teachers";

export default async function NewTeacherPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add teacher" description="Invite a new staff member." />
      <Card className="p-6">
        <form action={createTeacher} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Full name</label>
              <input type="text" name="name" required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email (login)</label>
              <input type="email" name="email" required className="input" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Primary subject</label>
              <input type="text" name="subject" className="input" placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Phone</label>
              <input type="text" name="phone" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Temporary password</label>
            <input type="text" name="password" className="input" placeholder="teacher123 (default)" />
            <p className="text-xs text-ink-soft mt-1">They should change this after first sign-in.</p>
          </div>
          <div className="pt-2">
            <Button type="submit">Save teacher</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
