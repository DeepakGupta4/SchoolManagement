"use client";

import { useCallback, useState, type ReactNode } from "react";
import { CalendarX } from "lucide-react";
import { Avatar, Badge, Button, Modal, Skeleton } from "@/components/ui";
import { useAsyncList } from "@/hooks/useAsyncList";
import {
  getStudentAttendance,
  type AttendanceStatus,
  type StudentAttendanceHistory,
} from "@/lib/api/attendance";
import { fullName, type Student } from "@/types/student";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const STATUS_META: Record<AttendanceStatus, { label: string; variant: BadgeVariant }> = {
  present: { label: "Present", variant: "success" },
  absent: { label: "Absent", variant: "danger" },
  late: { label: "Late", variant: "warning" },
  "half-day": { label: "Half-day", variant: "info" },
  leave: { label: "Leave", variant: "default" },
};
const STATUS_ORDER: AttendanceStatus[] = ["present", "absent", "late", "half-day", "leave"];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
// Format date strings WITHOUT `new Date()` so the component stays render-pure.
const fmtDay = (iso: string) => `${iso.slice(8, 10)} ${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1] ?? ""}`;
const monthLabel = (ym: string) => `${MONTHS_LONG[Number(ym.slice(5, 7)) - 1] ?? ""} ${ym.slice(0, 4)}`;

/**
 * A read-only dialog showing one student's attendance — a fair-percent headline,
 * a per-status tally, and the full mark history (newest first, grouped by month)
 * with a status filter. Opened from the "View attendance" action on the students
 * list. Fetches lazily when opened for a student.
 */
export function StudentAttendanceModal({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [filter, setFilter] = useState<AttendanceStatus | "all">("all");

  // Only hits the API while the dialog is open for a student. Wrapping the single
  // record set as a one-element array lets us reuse the race-safe list hook.
  const fetcher = useCallback(
    () =>
      open && student
        ? getStudentAttendance(student.id).then((d) => [d])
        : Promise.resolve([] as StudentAttendanceHistory[]),
    [open, student]
  );
  const { items, loading, error } = useAsyncList<StudentAttendanceHistory>(fetcher);
  const data = items[0] ?? null;

  const records = data?.records ?? [];
  const shown = filter === "all" ? records : records.filter((r) => r.status === filter);

  // Group the (already newest-first) records by calendar month, preserving order.
  const groups: { month: string; items: typeof records }[] = [];
  for (const r of shown) {
    const ym = r.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === ym) last.items.push(r);
    else groups.push({ month: ym, items: [r] });
  }

  const pct = data?.summary.percent ?? 0;
  const hasDays = (data?.summary.total ?? 0) > 0;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Attendance"
      size="lg"
      footer={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      {student && (
        <div className="flex flex-col gap-5">
          {/* Who */}
          <div className="flex items-center gap-3">
            <Avatar name={fullName(student)} src={student.avatar} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-text">{fullName(student)}</p>
              <p className="truncate text-xs text-subtle">
                {student.className} · Section {student.section} · Roll {String(student.rollNo)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-border bg-surface-sunken px-4 py-8 text-center">
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Headline + tally */}
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface-sunken p-4">
                <div className="flex min-w-20 flex-col items-center">
                  <span
                    className={`text-3xl font-bold ${
                      !hasDays ? "text-subtle" : pct < 75 ? "text-danger-text" : "text-success-text"
                    }`}
                  >
                    {hasDays ? `${pct}%` : "—"}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-subtle">Attendance</span>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="grid flex-1 grid-cols-3 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-6">
                  {STATUS_ORDER.map((s) => (
                    <div key={s} className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wide text-subtle">
                        {STATUS_META[s].label}
                      </span>
                      <span className="font-semibold text-text">{data.summary[statusKey(s)]}</span>
                    </div>
                  ))}
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wide text-subtle">Total</span>
                    <span className="font-semibold text-text">{data.summary.total}</span>
                  </div>
                </div>
              </div>

              {records.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-sunken px-4 py-10 text-center">
                  <CalendarX className="size-6 text-subtle" />
                  <p className="text-sm font-medium text-text">No attendance recorded yet</p>
                  <p className="text-xs text-subtle">
                    This student has no attendance marked. Mark it from the Attendance screen.
                  </p>
                </div>
              ) : (
                <>
                  {/* Status filter */}
                  <div className="flex flex-wrap gap-1.5">
                    <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                      All ({records.length})
                    </FilterChip>
                    {STATUS_ORDER.map((s) => {
                      const n = data.summary[statusKey(s)];
                      if (n === 0) return null;
                      return (
                        <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
                          {STATUS_META[s].label} ({n})
                        </FilterChip>
                      );
                    })}
                  </div>

                  {/* History, grouped by month */}
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                    {groups.map((g) => (
                      <div key={g.month}>
                        <p className="sticky top-0 z-10 bg-surface-sunken px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">
                          {monthLabel(g.month)}
                        </p>
                        <ul className="divide-y divide-border">
                          {g.items.map((r) => (
                            <li
                              key={r.date}
                              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                            >
                              <span className="text-text">{fmtDay(r.date)}</span>
                              <Badge variant={STATUS_META[r.status].variant}>
                                {STATUS_META[r.status].label}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {shown.length === 0 && (
                      <p className="px-3 py-6 text-center text-sm text-subtle">
                        No {filter === "all" ? "" : STATUS_META[filter].label.toLowerCase() + " "}records.
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

/** Maps a status to its summary count key (half-day → halfDay). */
function statusKey(s: AttendanceStatus): "present" | "absent" | "late" | "halfDay" | "leave" {
  return s === "half-day" ? "halfDay" : s;
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary-soft text-primary-text"
          : "border-border text-muted hover:bg-surface-hover hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
