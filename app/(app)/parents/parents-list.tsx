"use client";

import { Card, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { AdminPasswordResetCard } from "@/components/admin-password-reset-card";
import { LinkChildButton, UnlinkChildButton, DeleteParentButton } from "./link-buttons";
import ListFilterBar from "@/components/list-filter-bar";

type Parent = {
  id: string;
  phone: string | null;
  user: { id: string; name: string; email: string };
  children: { id: string; firstName: string; lastName: string; classRoom: { name: string } | null }[];
};

export default function ParentsList({
  parents,
  unlinkedStudents,
}: {
  parents: Parent[];
  unlinkedStudents: { id: string; firstName: string; lastName: string; classRoom: { name: string } | null }[];
}) {
  return (
    <ListFilterBar
      searchPlaceholder="Search parent name, email…"
      sortOptions={[
        { value: "name",     label: "Name A → Z" },
        { value: "children", label: "Most children" },
      ]}
      defaultSort="name"
      totalCount={parents.length}
    >
      {({ search, sort }) => {
        let filtered = parents.filter((p) => {
          const q = search.toLowerCase();
          return (
            !q ||
            p.user.name.toLowerCase().includes(q) ||
            p.user.email.toLowerCase().includes(q) ||
            p.children.some((c) =>
              `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
            )
          );
        });
        filtered = [...filtered].sort((a, b) => {
          if (sort === "children") return b.children.length - a.children.length;
          return a.user.name.localeCompare(b.user.name);
        });

        if (filtered.length === 0) {
          return (
            <EmptyState
              title="No parents match"
              description={search ? "Try a different search." : "Add the first parent above."}
            />
          );
        }

        return (
          <div className="space-y-4">
            {filtered.map((parent) => (
              <Card key={parent.id} className="overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-border">
                  <div>
                    <p className="font-semibold">{parent.user.name}</p>
                    <p className="text-sm text-ink-soft">{parent.user.email}</p>
                    {parent.phone && <p className="text-xs text-ink-soft">{parent.phone}</p>}
                  </div>
                  <DeleteParentButton id={parent.id} name={parent.user.name} />
                </div>

                <div className="px-5 py-3">
                  <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2">
                    Linked children ({parent.children.length})
                  </p>
                  {parent.children.length === 0 ? (
                    <p className="text-sm text-ink-soft italic">No children linked yet.</p>
                  ) : (
                    <ul className="space-y-1.5 mb-3">
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

                  {unlinkedStudents.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
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

                <div className="px-5 pb-4">
                  <AdminPasswordResetCard userId={parent.user.id} userName={parent.user.name} />
                </div>
              </Card>
            ))}
          </div>
        );
      }}
    </ListFilterBar>
  );
}
