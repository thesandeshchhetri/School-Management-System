"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Pencil, FileText } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import DeleteButton from "./delete-button";
import ListFilterBar from "@/components/list-filter-bar";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender: string | null;
  phone: string | null;
  classRoom: { id: string; name: string } | null;
};

export default function StudentsList({
  students,
  classRooms,
  isAdmin,
}: {
  students: Student[];
  classRooms: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const filterOptions = classRooms.map((c) => ({ value: c.id, label: c.name }));
  filterOptions.unshift({ value: "unassigned", label: "Unassigned" });

  const sortOptions = [
    { value: "name-asc",    label: "Name A → Z" },
    { value: "name-desc",   label: "Name Z → A" },
    { value: "class",       label: "By class" },
    { value: "admissionNo", label: "Admission No." },
  ];

  return (
    <ListFilterBar
      searchPlaceholder="Search students…"
      filterLabel="Class"
      filterOptions={filterOptions}
      sortOptions={sortOptions}
      defaultSort="name-asc"
      totalCount={students.length}
      filteredCount={undefined}
    >
      {({ search, filter, sort }) => {
        let filtered = students.filter((s) => {
          const q = search.toLowerCase();
          const matchesSearch =
            !q ||
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
            s.admissionNo.toLowerCase().includes(q) ||
            (s.classRoom?.name ?? "").toLowerCase().includes(q);

          const matchesFilter =
            !filter ||
            (filter === "unassigned" ? !s.classRoom : s.classRoom?.id === filter);

          return matchesSearch && matchesFilter;
        });

        filtered = [...filtered].sort((a, b) => {
          switch (sort) {
            case "name-desc":
              return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
            case "class":
              return (a.classRoom?.name ?? "zzz").localeCompare(b.classRoom?.name ?? "zzz");
            case "admissionNo":
              return a.admissionNo.localeCompare(b.admissionNo);
            default: // name-asc
              return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          }
        });

        if (filtered.length === 0) {
          return (
            <Card>
              <EmptyState
                title="No students match"
                description="Try adjusting your search or filter."
              />
            </Card>
          );
        }

        return (
          <Card className="overflow-hidden">
            {/* Count pill */}
            <div className="px-5 py-2.5 border-b border-border flex items-center justify-between">
              <span className="text-xs text-ink-soft">
                {filtered.length} student{filtered.length !== 1 ? "s" : ""}
                {filter || search ? ` matched` : " total"}
              </span>
            </div>

            {/* Mobile cards */}
            <ul className="sm:hidden divide-y divide-border">
              {filtered.map((s) => (
                <li key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {s.admissionNo} · {s.classRoom?.name ?? "Unassigned"}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/students/${s.id}/report-card`}
                        aria-label={`Report card for ${s.firstName} ${s.lastName}`}
                        className="p-2 rounded-lg bg-background text-ink-soft">
                        <FileText className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <Link href={`/students/${s.id}`}
                        aria-label={`Edit ${s.firstName} ${s.lastName}`}
                        className="p-2 rounded-lg bg-background text-ink-soft">
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <DeleteButton id={s.id} name={`${s.firstName} ${s.lastName}`} />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <caption className="sr-only">List of enrolled students</caption>
              <thead>
                <tr className="border-b border-border text-left text-ink-soft text-xs uppercase tracking-wide">
                  <th scope="col" className="px-5 py-3 font-medium">Name</th>
                  <th scope="col" className="px-5 py-3 font-medium">Admission No.</th>
                  <th scope="col" className="px-5 py-3 font-medium">Class</th>
                  <th scope="col" className="px-5 py-3 font-medium">Gender</th>
                  <th scope="col" className="px-5 py-3 font-medium">Phone</th>
                  {isAdmin && <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-3 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="px-5 py-3 text-ink-soft">{s.admissionNo}</td>
                    <td className="px-5 py-3">
                      {s.classRoom
                        ? <Badge tone="neutral">{s.classRoom.name}</Badge>
                        : <span className="text-ink-soft text-xs italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{s.gender ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-soft">{s.phone ?? "—"}</td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/students/${s.id}/report-card`}
                            aria-label={`Report card for ${s.firstName} ${s.lastName}`}
                            className="p-1.5 rounded-md hover:bg-border text-ink-soft">
                            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                          <Link href={`/students/${s.id}`}
                            aria-label={`Edit ${s.firstName} ${s.lastName}`}
                            className="p-1.5 rounded-md hover:bg-border text-ink-soft">
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                          <DeleteButton id={s.id} name={`${s.firstName} ${s.lastName}`} />
                        </div>
                      </td>
                    )}
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
