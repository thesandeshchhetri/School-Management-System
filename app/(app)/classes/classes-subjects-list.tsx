"use client";

import ListFilterBar from "@/components/list-filter-bar";
import { Card, EmptyState } from "@/components/ui";
import ClassDeleteButton from "./class-delete-button";
import SubjectDeleteButton from "./subject-delete-button";

type ClassRoom = {
  id: string;
  name: string;
  gradeLevel: number;
  capacity: number;
  students: { id: string }[];
  classTeacher: { user: { name: string } } | null;
};

type Subject = {
  id: string;
  name: string;
  code: string;
  classRoom: { name: string } | null;
  teachers: { teacher: { user: { name: string } } }[];
};

export function ClassRoomsList({ classRooms }: { classRooms: ClassRoom[] }) {
  return (
    <ListFilterBar
      searchPlaceholder="Search classes…"
      sortOptions={[
        { value: "grade", label: "By grade" },
        { value: "name",  label: "Name A → Z" },
        { value: "size",  label: "Largest first" },
      ]}
      defaultSort="grade"
      totalCount={classRooms.length}
    >
      {({ search, sort }) => {
        let filtered = classRooms.filter((c) =>
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.classTeacher?.user.name ?? "").toLowerCase().includes(search.toLowerCase())
        );
        filtered = [...filtered].sort((a, b) => {
          if (sort === "name") return a.name.localeCompare(b.name);
          if (sort === "size") return b.students.length - a.students.length;
          return a.gradeLevel - b.gradeLevel;
        });

        if (filtered.length === 0) {
          return <EmptyState title="No classes match" description="Try a different search." />;
        }

        return (
          <ul className="divide-y divide-border">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-ink-soft">
                    {c.classTeacher?.user.name ?? "No class teacher"} · {c.students.length}/{c.capacity} students
                  </p>
                </div>
                <ClassDeleteButton id={c.id} name={c.name} />
              </li>
            ))}
          </ul>
        );
      }}
    </ListFilterBar>
  );
}

export function SubjectsList({ subjects }: { subjects: Subject[] }) {
  return (
    <ListFilterBar
      searchPlaceholder="Search subjects…"
      sortOptions={[
        { value: "name",  label: "Name A → Z" },
        { value: "class", label: "By class" },
        { value: "code",  label: "By code" },
      ]}
      defaultSort="name"
      totalCount={subjects.length}
    >
      {({ search, sort }) => {
        let filtered = subjects.filter((s) => {
          const q = search.toLowerCase();
          return (
            !q ||
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            (s.classRoom?.name ?? "").toLowerCase().includes(q) ||
            (s.teachers[0]?.teacher.user.name ?? "").toLowerCase().includes(q)
          );
        });
        filtered = [...filtered].sort((a, b) => {
          if (sort === "class") return (a.classRoom?.name ?? "").localeCompare(b.classRoom?.name ?? "");
          if (sort === "code") return a.code.localeCompare(b.code);
          return a.name.localeCompare(b.name);
        });

        if (filtered.length === 0) {
          return <EmptyState title="No subjects match" description="Try a different search." />;
        }

        return (
          <ul className="divide-y divide-border">
            {filtered.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {s.name} <span className="text-ink-soft font-normal text-xs">({s.code})</span>
                  </p>
                  <p className="text-xs text-ink-soft">
                    {s.classRoom?.name ?? "Not tied to a class"} · {s.teachers[0]?.teacher.user.name ?? "Unassigned"}
                  </p>
                </div>
                <SubjectDeleteButton id={s.id} name={s.name} />
              </li>
            ))}
          </ul>
        );
      }}
    </ListFilterBar>
  );
}
