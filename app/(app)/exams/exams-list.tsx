"use client";

import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui";
import ExamDeleteButton from "./delete-button";
import ListFilterBar from "@/components/list-filter-bar";
import { formatDate } from "@/lib/utils";

type Exam = {
  id: string;
  name: string;
  examDate: Date;
  maxMarks: number;
  classRoom: { id: string; name: string };
  gradeEntries: { id: string }[];
};

export default function ExamsList({
  exams,
  classRooms,
  isAdmin,
}: {
  exams: Exam[];
  classRooms: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const filterOptions = classRooms.map((c) => ({ value: c.id, label: c.name }));
  const sortOptions = [
    { value: "date-desc", label: "Newest first" },
    { value: "date-asc",  label: "Oldest first" },
    { value: "name",      label: "Name A → Z" },
    { value: "class",     label: "By class" },
  ];

  return (
    <ListFilterBar
      searchPlaceholder="Search exam name…"
      filterLabel="Class"
      filterOptions={filterOptions}
      sortOptions={sortOptions}
      defaultSort="date-desc"
      totalCount={exams.length}
    >
      {({ search, filter, sort }) => {
        let filtered = exams.filter((e) => {
          const q = search.toLowerCase();
          const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.classRoom.name.toLowerCase().includes(q);
          const matchesFilter = !filter || e.classRoom.id === filter;
          return matchesSearch && matchesFilter;
        });

        filtered = [...filtered].sort((a, b) => {
          switch (sort) {
            case "date-asc": return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
            case "name":     return a.name.localeCompare(b.name);
            case "class":    return a.classRoom.name.localeCompare(b.classRoom.name);
            default:         return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
          }
        });

        if (filtered.length === 0) {
          return (
            <Card>
              <EmptyState title="No exams match" description="Try adjusting your search or filter." />
            </Card>
          );
        }

        return (
          <Card className="overflow-hidden">
            <div className="px-5 py-2.5 border-b border-border">
              <span className="text-xs text-ink-soft">
                {filtered.length} exam{filtered.length !== 1 ? "s" : ""}{filter || search ? " matched" : " total"}
              </span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/exams/${e.id}`} className="flex-1 min-w-0 hover:text-primary transition-colors">
                    <p className="text-sm font-semibold truncate">{e.name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {e.classRoom.name} · {formatDate(e.examDate)} · {e.gradeEntries.length} marks entered
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge tone="neutral">Max {e.maxMarks}</Badge>
                    {isAdmin && <ExamDeleteButton id={e.id} name={e.name} />}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      }}
    </ListFilterBar>
  );
}
