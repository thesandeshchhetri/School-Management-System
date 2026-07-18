"use client";

import { Badge, Card, EmptyState } from "@/components/ui";
import ListFilterBar from "@/components/list-filter-bar";
import { formatDate } from "@/lib/utils";

type AttendanceRecord = {
  id: string;
  date: Date;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks: string | null;
};

const STATUS_TONE = {
  PRESENT: "success", LATE: "warn", EXCUSED: "neutral", ABSENT: "danger",
} as const;

export default function AttendanceHistory({
  records,
  studentName,
}: {
  records: AttendanceRecord[];
  studentName: string;
}) {
  const statusOptions = [
    { value: "PRESENT", label: "Present" },
    { value: "LATE",    label: "Late" },
    { value: "EXCUSED", label: "Excused" },
    { value: "ABSENT",  label: "Absent" },
  ];
  const sortOptions = [
    { value: "date-desc", label: "Newest first" },
    { value: "date-asc",  label: "Oldest first" },
    { value: "status",    label: "By status" },
  ];

  const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const pct = records.length > 0 ? Math.round((present / records.length) * 100) : null;

  return (
    <div>
      {/* Summary strip */}
      {pct !== null && (
        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-border">
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-ink">{pct}%</p>
            <p className="text-xs text-ink-soft">Attendance rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-success">{records.filter(r => r.status === "PRESENT").length}</p>
            <p className="text-xs text-ink-soft">Present</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-warn">{records.filter(r => r.status === "LATE").length}</p>
            <p className="text-xs text-ink-soft">Late</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-danger">{records.filter(r => r.status === "ABSENT").length}</p>
            <p className="text-xs text-ink-soft">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-ink-soft">{records.filter(r => r.status === "EXCUSED").length}</p>
            <p className="text-xs text-ink-soft">Excused</p>
          </div>
        </div>
      )}

      <ListFilterBar
        searchPlaceholder="Search by date…"
        filterLabel="Status"
        filterOptions={statusOptions}
        sortOptions={sortOptions}
        defaultSort="date-desc"
        totalCount={records.length}
      >
        {({ search, filter, sort }) => {
          let filtered = records.filter((r) => {
            const matchesSearch = !search || formatDate(r.date).toLowerCase().includes(search.toLowerCase());
            const matchesFilter = !filter || r.status === filter;
            return matchesSearch && matchesFilter;
          });

          filtered = [...filtered].sort((a, b) => {
            switch (sort) {
              case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
              case "status":   return a.status.localeCompare(b.status);
              default:         return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
          });

          if (filtered.length === 0) {
            return (
              <Card>
                <EmptyState title="No records match" description="Try adjusting the filter." />
              </Card>
            );
          }

          return (
            <Card className="overflow-hidden">
              <div className="px-5 py-2.5 border-b border-border">
                <span className="text-xs text-ink-soft">
                  {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  {filter || search ? " matched" : " total"}
                </span>
              </div>
              <div className="divide-y divide-border">
                {filtered.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className="text-sm font-medium">{formatDate(r.date)}</span>
                      {r.remarks && (
                        <p className="text-xs text-ink-soft mt-0.5">{r.remarks}</p>
                      )}
                    </div>
                    <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          );
        }}
      </ListFilterBar>
    </div>
  );
}
