"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import DeleteButton from "./delete-button";
import ListFilterBar from "@/components/list-filter-bar";

type Teacher = {
  id: string;
  subject: string | null;
  phone: string | null;
  user: { name: string; email: string };
  classesAsTeacher: { id: string }[];
};

export default function TeachersList({ teachers }: { teachers: Teacher[] }) {
  const sortOptions = [
    { value: "name-asc",     label: "Name A → Z" },
    { value: "name-desc",    label: "Name Z → A" },
    { value: "subject",      label: "By subject" },
    { value: "classes-desc", label: "Most classes" },
  ];

  return (
    <ListFilterBar
      searchPlaceholder="Search name, email, subject…"
      sortOptions={sortOptions}
      defaultSort="name-asc"
      totalCount={teachers.length}
    >
      {({ search, sort }) => {
        let filtered = teachers.filter((t) => {
          const q = search.toLowerCase();
          return (
            !q ||
            t.user.name.toLowerCase().includes(q) ||
            t.user.email.toLowerCase().includes(q) ||
            (t.subject ?? "").toLowerCase().includes(q)
          );
        });

        filtered = [...filtered].sort((a, b) => {
          switch (sort) {
            case "name-desc":    return b.user.name.localeCompare(a.user.name);
            case "subject":      return (a.subject ?? "").localeCompare(b.subject ?? "");
            case "classes-desc": return b.classesAsTeacher.length - a.classesAsTeacher.length;
            default:             return a.user.name.localeCompare(b.user.name);
          }
        });

        if (filtered.length === 0) {
          return (
            <Card>
              <EmptyState title="No teachers match" description="Try adjusting your search." />
            </Card>
          );
        }

        return (
          <Card className="overflow-hidden">
            <div className="px-5 py-2.5 border-b border-border">
              <span className="text-xs text-ink-soft">
                {filtered.length} staff member{filtered.length !== 1 ? "s" : ""}
                {search ? " matched" : " total"}
              </span>
            </div>

            {/* Mobile */}
            <ul className="sm:hidden divide-y divide-border">
              {filtered.map((t) => (
                <li key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{t.user.name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {t.subject ?? "—"} · {t.classesAsTeacher.length} classes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/teachers/${t.id}`} aria-label={`Edit ${t.user.name}`}
                      className="p-2 rounded-lg bg-background text-ink-soft">
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <DeleteButton id={t.id} name={t.user.name} />
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop */}
            <table className="hidden sm:table w-full text-sm">
              <caption className="sr-only">List of teaching staff</caption>
              <thead>
                <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                  <th scope="col" className="px-5 py-3 font-medium">Name</th>
                  <th scope="col" className="px-5 py-3 font-medium">Email</th>
                  <th scope="col" className="px-5 py-3 font-medium">Subject</th>
                  <th scope="col" className="px-5 py-3 font-medium">Classes</th>
                  <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-3 font-medium">{t.user.name}</td>
                    <td className="px-5 py-3 text-ink-soft">{t.user.email}</td>
                    <td className="px-5 py-3 text-ink-soft">{t.subject ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone="neutral">{t.classesAsTeacher.length} classes</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/teachers/${t.id}`} aria-label={`Edit ${t.user.name}`}
                          className="p-1.5 rounded-md hover:bg-border text-ink-soft">
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                        <DeleteButton id={t.id} name={t.user.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      }}
    </ListFilterBar>
  );
}
