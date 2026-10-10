"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  X,
  Download,
  Users,
  Loader2,
  UserX,
  PartyPopper,
  CalendarDays,
  FileText,
  Bell,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Modal,
  PageHeader,
  Select,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { exportTablePdf } from "@/lib/exportPdf";
import { useClassOptions } from "@/hooks/useClassOptions";
import { fetchAllStudents } from "@/lib/api/students";
import {
  getAttendance,
  getAttendanceSummary,
  saveAttendance,
  notifyAbsentees,
  type AttendanceStatus,
  type AttendanceMark,
  type AttendanceStudentSummary,
} from "@/lib/api/attendance";
import { holidaysApi, type Holiday } from "@/lib/api/holidays";
import type { Student } from "@/types/student";

type Row = { id: string; name: string; roll: number };

const statusConfig: Record<AttendanceStatus, { tone: string; bar: string; label: string }> = {
  present: { tone: "bg-success-soft text-success-text", bar: "bg-success", label: "Present" },
  absent: { tone: "bg-danger-soft text-danger-text", bar: "bg-danger", label: "Absent" },
  late: { tone: "bg-warning-soft text-warning-text", bar: "bg-warning", label: "Late" },
  "half-day": { tone: "bg-info-soft text-info-text", bar: "bg-info", label: "Half-day" },
  leave: { tone: "bg-violet-soft text-violet-text", bar: "bg-violet", label: "Leave" },
};

/** Options for the per-student status <Select>. Order matches statusConfig. */
const STATUS_OPTIONS: { label: string; value: AttendanceStatus }[] = [
  { label: "Present", value: "present" },
  { label: "Absent", value: "absent" },
  { label: "Late", value: "late" },
  { label: "Half-day", value: "half-day" },
  { label: "Leave", value: "leave" },
];

/** Today as yyyy-mm-dd in LOCAL time — UTC would read yesterday in the IST
 *  morning and default the roll-call to the wrong day. */
const todayIso = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Current month as "YYYY-MM" (local), for the report month picker default. */
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** A YYYY-MM-DD date shifted by `delta` days (local time). Module-scope so the
 *  `new Date` call never runs during render. */
function shiftIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Short weekday label ("Mon") for a YYYY-MM-DD date. Call from effects only. */
function weekdayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
}

/** First and last calendar day (YYYY-MM-DD) of a "YYYY-MM" month. */
function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate(); // day 0 of next month = last of this
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

/** "2026-10" -> "October 2026". Pure string math — safe to call during render. */
function monthTitle(month: string): string {
  const [y, m] = month.split("-");
  return `${MONTH_NAMES[Number(m) - 1] ?? month} ${y}`;
}

/** One bar in the weekly overview. */
type WeekBar = { date: string; label: string; presentPercent: number };

/** Tailwind fill for an attendance percentage, matching the summary thresholds. */
const pctBar = (pct: number) =>
  pct >= 90 ? "bg-success" : pct >= 75 ? "bg-warning" : "bg-danger";

export default function AttendancePage() {
  const { toast } = useToast();
  const { classOptions, sectionOptions, defaultClass } = useClassOptions();

  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState(todayIso());

  const [roster, setRoster] = useState<Row[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  // Students that already have a saved record for the date — used to know who is
  // still "unmarked" (the ones the auto-absent rule targets).
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  // How many of those saved records are "absent" — gates the "Notify parents"
  // action, which alerts based on what is persisted, not the live toggles.
  const [savedAbsentCount, setSavedAbsentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Bumped after a successful save so the real-data views (weekly overview,
  // monthly report) refresh to include what was just marked.
  const [summaryRefresh, setSummaryRefresh] = useState(0);

  // Real weekly overview: present % per recorded day over the last 7 days.
  const [weekBars, setWeekBars] = useState<WeekBar[]>([]);
  const [weekLoading, setWeekLoading] = useState(false);

  // Monthly report (attendance register) modal.
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportRows, setReportRows] = useState<AttendanceStudentSummary[]>([]);
  const [reportDays, setReportDays] = useState(0);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);

  // Pre-select the lowest class (e.g. Nursery) once it becomes known, but only
  // while the user hasn't chosen one yet. Ref-guarded so it fires a single time,
  // and deferred so we never call setState synchronously inside the effect. From
  // there the roster/marking UI loads exactly as if the user had picked it, and
  // a class the user later chooses is never overridden.
  const didPreselectClass = useRef(false);
  useEffect(() => {
    if (didPreselectClass.current || className || !defaultClass) return;
    didPreselectClass.current = true;
    const t = setTimeout(() => setClassName(defaultClass), 0);
    return () => clearTimeout(t);
  }, [className, defaultClass]);

  // School holidays — a matching date closes the marking UI entirely.
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  useEffect(() => {
    let cancelled = false;
    holidaysApi
      .list()
      .then((rows) => !cancelled && setHolidays(rows))
      .catch(() => {
        /* Holidays are best-effort; marking still works without them. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sunday is a weekly holiday. A real holiday on the same date takes priority
  // for the name; otherwise a synthetic "Sunday" holiday closes the marking UI.
  const isSunday = useMemo(() => new Date(`${date}T00:00:00`).getDay() === 0, [date]);
  const holiday = useMemo<Holiday | null>(() => {
    const real = holidays.find((h) => h.date === date);
    if (real) return real;
    if (isSunday)
      return { id: "sunday", date, name: "Sunday", type: "Weekly holiday" };
    return null;
  }, [holidays, date, isSunday]);

  // Load the class roster (real students) + any saved roll-call for the date.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      // Nothing to load until both a class and a section are chosen.
      if (!className || !section) {
        setRoster([]);
        setAttendance({});
        setDirty(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      // Full roster (uncapped) and ACTIVE students only — you take attendance for
      // currently-enrolled students, not transferred/inactive/alumni ones.
      Promise.all([
        fetchAllStudents({ className, status: "active" }),
        getAttendance(className, section, date),
      ])
        .then(([students, saved]) => {
          if (cancelled) return;
          const rows: Row[] = (students as Student[])
            .filter((s) => s.section === section)
            .map((s) => ({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`.trim(),
              roll: Number(s.rollNo) || 0,
            }))
            .sort((a, b) => a.roll - b.roll);

          const savedMap = new Map(saved.map((m) => [m.studentId, m.status]));
          const marks: Record<string, AttendanceStatus> = {};
          for (const r of rows) marks[r.id] = savedMap.get(r.id) ?? "present";

          setRoster(rows);
          setAttendance(marks);
          setSavedIds(new Set(savedMap.keys()));
          setSavedAbsentCount(saved.filter((m) => m.status === "absent").length);
          setDirty(false);
        })
        .catch(() => {
          if (!cancelled) toast({ title: "Could not load attendance", variant: "error" });
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [className, section, date, toast]);

  // Real "Weekly Overview": the last 7 calendar days up to the selected date.
  // Bars come from days that actually have records — never fabricated — so an
  // empty range leaves the EmptyState in place. Labels are resolved here (not in
  // render) to keep `new Date` out of the render path.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!className || !section) {
        setWeekBars([]);
        setWeekLoading(false);
        return;
      }
      setWeekLoading(true);
      getAttendanceSummary(className, section, shiftIso(date, -6), date)
        .then((summary) => {
          if (cancelled) return;
          setWeekBars(
            summary.daily.map((d) => ({
              date: d.date,
              label: weekdayLabel(d.date),
              presentPercent: d.presentPercent,
            }))
          );
        })
        .catch(() => {
          if (!cancelled) setWeekBars([]);
        })
        .finally(() => {
          if (!cancelled) setWeekLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [className, section, date, summaryRefresh]);

  // Monthly report (attendance register) — fetched only while the modal is open,
  // for the picked month and the page's current class + section.
  useEffect(() => {
    if (!reportOpen) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (!className || !section) {
        setReportRows([]);
        setReportDays(0);
        setReportError(false);
        setReportLoading(false);
        return;
      }
      const { from, to } = monthRange(reportMonth);
      setReportLoading(true);
      setReportError(false);
      getAttendanceSummary(className, section, from, to)
        .then((summary) => {
          if (cancelled) return;
          setReportRows(summary.students);
          setReportDays(summary.daily.length);
        })
        .catch(() => {
          if (!cancelled) setReportError(true);
        })
        .finally(() => {
          if (!cancelled) setReportLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [reportOpen, reportMonth, className, section, summaryRefresh]);

  const statusOf = (id: string): AttendanceStatus => attendance[id] ?? "present";
  const statuses = roster.map((r) => statusOf(r.id));
  const present = statuses.filter((v) => v === "present").length;
  const absent = statuses.filter((v) => v === "absent").length;
  const late = statuses.filter((v) => v === "late").length;
  const halfDay = statuses.filter((v) => v === "half-day").length;
  const leave = statuses.filter((v) => v === "leave").length;
  const pct = roster.length > 0 ? Math.round((present / roster.length) * 100) : 0;

  const mark = (id: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
    setDirty(true);
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, ...Object.fromEntries(roster.map((r) => [r.id, status])) }));
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    if (roster.length === 0) return;
    setSaving(true);
    try {
      const records: AttendanceMark[] = roster.map((r) => ({
        studentId: r.id,
        studentName: r.name,
        roll: r.roll,
        status: statusOf(r.id),
      }));
      await saveAttendance({ className, section, date, records });
      setSavedIds(new Set(roster.map((r) => r.id)));
      setSavedAbsentCount(records.filter((r) => r.status === "absent").length);
      setDirty(false);
      setSummaryRefresh((n) => n + 1);
      toast({ title: "Attendance saved", description: `${className} · ${section} · ${date}` });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, attendance, className, section, date, toast]);

  // Students with no saved record yet — the ones the "by 11 AM → absent" rule
  // targets. Everyone shows as "present" by default in the UI, so unmarked is
  // tracked by the saved set, not the local toggle.
  const unmarked = roster.filter((r) => !savedIds.has(r.id));

  /** Admin control: mark every still-unmarked student absent, then save. */
  const markRemainingAbsent = useCallback(async () => {
    if (holiday || unmarked.length === 0) return;
    setSaving(true);
    try {
      const next = { ...attendance };
      for (const r of unmarked) next[r.id] = "absent";
      const records: AttendanceMark[] = roster.map((r) => ({
        studentId: r.id,
        studentName: r.name,
        roll: r.roll,
        status: next[r.id] ?? "present",
      }));
      await saveAttendance({ className, section, date, records });
      setAttendance(next);
      setSavedIds(new Set(roster.map((r) => r.id)));
      setSavedAbsentCount(records.filter((r) => r.status === "absent").length);
      setDirty(false);
      setSummaryRefresh((n) => n + 1);
      toast({
        title: `${unmarked.length} marked absent`,
        description: `${className} · ${section} · ${date}`,
      });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }, [holiday, unmarked, attendance, roster, className, section, date, toast]);

  /**
   * Explicitly email the parents of today's SAVED absentees. Best-effort — the
   * toast reports honestly what the server actually did (how many were emailed,
   * how many had no email, or that email isn't configured at all).
   */
  const handleNotify = useCallback(async () => {
    if (holiday || savedAbsentCount === 0) return;
    setNotifying(true);
    try {
      const res = await notifyAbsentees(className, section, date);
      if (!res.emailConfigured) {
        toast({
          title: "Email isn't set up on the server — ask admin to add it",
          description: `${res.total} absentee(s) on ${date} · no alerts were sent.`,
          variant: "warning",
        });
      } else {
        const parts = [`Alerted ${res.emailed} parent${res.emailed === 1 ? "" : "s"}`];
        if (res.noContact > 0) parts.push(`${res.noContact} had no email`);
        toast({ title: parts.join(" · "), description: `${res.total} absentee(s) on ${date}.` });
      }
    } catch (e) {
      toast({
        title: "Could not notify parents",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setNotifying(false);
    }
  }, [holiday, savedAbsentCount, className, section, date, toast]);

  const pctVariant = pct >= 90 ? "success" : pct >= 75 ? "warning" : "danger";

  const handleExport = () => {
    if (roster.length === 0) {
      toast({ title: "Nothing to export", variant: "warning" });
      return;
    }
    exportToCsv<Row>(
      `attendance-${className}-${section}-${date}`,
      [
        { header: "Date", value: () => date },
        { header: "Class", value: () => `${className} ${section}` },
        { header: "Roll No", value: (r) => r.roll },
        { header: "Student ID", value: (r) => r.id },
        { header: "Name", value: (r) => r.name },
        { header: "Status", value: (r) => statusConfig[statusOf(r.id)].label },
      ],
      roster
    );
    toast({ title: "Export ready", description: `${roster.length} records exported.` });
  };

  const reportSubtitle = `${className} · Section ${section} · ${monthTitle(reportMonth)} · ${reportDays} day(s) recorded`;

  const handleExportReportCsv = () => {
    if (reportRows.length === 0) {
      toast({ title: "Nothing to export", variant: "warning" });
      return;
    }
    exportToCsv<AttendanceStudentSummary>(
      `attendance-register-${className}-${section}-${reportMonth}`,
      [
        { header: "Roll No", value: (s) => s.roll },
        { header: "Student", value: (s) => s.studentName },
        { header: "Present", value: (s) => s.present },
        { header: "Absent", value: (s) => s.absent },
        { header: "Late", value: (s) => s.late },
        { header: "Half-day", value: (s) => s.halfDay },
        { header: "Leave", value: (s) => s.leave },
        { header: "Total", value: (s) => s.total },
        { header: "Attendance %", value: (s) => s.percent },
      ],
      reportRows
    );
    toast({ title: "Export ready", description: `${reportRows.length} students exported.` });
  };

  const handleExportReportPdf = () => {
    if (reportRows.length === 0) {
      toast({ title: "Nothing to export", variant: "warning" });
      return;
    }
    const ok = exportTablePdf({
      title: `Attendance Register — ${monthTitle(reportMonth)}`,
      subtitle: reportSubtitle,
      columns: ["Roll", "Student", "Present", "Absent", "Late", "Half-day", "Leave", "Total", "%"],
      rows: reportRows.map((s) => [
        s.roll,
        s.studentName,
        s.present,
        s.absent,
        s.late,
        s.halfDay,
        s.leave,
        s.total,
        `${s.percent}%`,
      ]),
    });
    if (!ok) {
      toast({
        title: "Couldn't open print view",
        description: "Allow pop-ups for this site, then try again.",
        variant: "warning",
      });
    }
  };

  // Register footer totals (pure arithmetic — safe in render).
  const reportTotals = reportRows.reduce(
    (a, s) => ({
      present: a.present + s.present,
      absent: a.absent + s.absent,
      late: a.late + s.late,
      halfDay: a.halfDay + s.halfDay,
      leave: a.leave + s.leave,
      total: a.total + s.total,
    }),
    { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, total: 0 }
  );
  // Same fair formula as the per-student rows: present + late + half-day/2 over
  // present + absent + late + half-day; leave excused.
  const reportGradeable =
    reportTotals.present + reportTotals.absent + reportTotals.late + reportTotals.halfDay;
  const reportOverallPct =
    reportGradeable > 0
      ? Math.round(
          ((reportTotals.present + reportTotals.late + 0.5 * reportTotals.halfDay) /
            reportGradeable) *
            100
        )
      : 0;

  const summary: { key: AttendanceStatus; label: string; value: number }[] = [
    { key: "present", label: "Present", value: present },
    { key: "absent", label: "Absent", value: absent },
    { key: "late", label: "Late", value: late },
    { key: "half-day", label: "Half-day", value: halfDay },
    { key: "leave", label: "Leave", value: leave },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Attendance"
        description={new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        actions={
          <>
            <Button variant="outline" onClick={() => setReportOpen(true)}>
              <CalendarDays className="size-4" />
              Monthly report
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          {summary.map((s) => {
            const sharePct = roster.length > 0 ? Math.round((s.value / roster.length) * 100) : 0;
            return (
              <Card key={s.key}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", statusConfig[s.key].tone)}>
                      <Users className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">{s.label}</p>
                      <p className="mt-0.5 text-xl font-semibold text-text">{s.value}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-text">{sharePct}%</p>
                    <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
                      <div className={cn("h-full rounded-full", statusConfig[s.key].bar)} style={{ width: `${sharePct}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Weekly Overview</p>
              <p className="mt-0.5 text-xs text-muted">
                {className && section
                  ? `${className} · ${section} — present % over the last 7 days`
                  : "Present % over the last 7 days"}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {weekLoading ? (
              <div className="grid h-40 place-items-center text-muted">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : weekBars.length === 0 ? (
              // Only days with records produce bars, so an empty range keeps the
              // empty state rather than fabricating a flat series.
              <EmptyState
                title="Not enough data yet"
                description={
                  className && section
                    ? "A weekly overview will appear once daily attendance is recorded."
                    : "Select a class and section to see the weekly trend."
                }
              />
            ) : (
              <div className="flex h-40 items-end justify-around gap-2 pt-2">
                {weekBars.map((b) => (
                  <div
                    key={b.date}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                    title={`${b.date}: ${b.presentPercent}% present`}
                  >
                    <span className="text-[11px] font-semibold text-text">{b.presentPercent}%</span>
                    <div className="flex w-full max-w-10 flex-1 items-end overflow-hidden rounded-md bg-surface-hover">
                      <div
                        className={cn("w-full rounded-md transition-all", pctBar(b.presentPercent))}
                        style={{ height: `${b.presentPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-subtle">{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {holiday && (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success-soft px-5 py-4 text-success-text">
          <PartyPopper className="size-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {holiday.id === "sunday" ? "🎉 Sunday — Weekly holiday" : `🎉 Holiday — ${holiday.name}`}
            </p>
            <p className="mt-0.5 text-xs">
              {holiday.type} · School is closed on this date. Attendance is not taken and no one is marked absent.
            </p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="w-36">
            <Select value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Select class" options={classOptions} aria-label="Select class" />
          </div>
          <div className="w-24">
            <Select value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section" options={sectionOptions} aria-label="Select section" />
          </div>
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className="focus-ring h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-text"
            aria-label="Attendance date"
          />
          <p className="text-xs text-muted">{roster.length} students</p>

          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={loading || roster.length === 0 || Boolean(holiday)} onClick={() => markAll("present")}>
              <Check className="size-3.5" />
              All Present
            </Button>
            <Button size="sm" variant="secondary" disabled={loading || roster.length === 0 || Boolean(holiday)} onClick={() => markAll("absent")}>
              <X className="size-3.5" />
              All Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={saving || loading || roster.length === 0 || Boolean(holiday) || unmarked.length === 0}
              onClick={markRemainingAbsent}
              title="Mark every student with no attendance yet as absent"
            >
              <UserX className="size-3.5" />
              Mark remaining Absent{unmarked.length > 0 ? ` (${unmarked.length})` : ""}
            </Button>
          </div>

          <Badge variant={pctVariant} className="px-3.5 py-1.5 text-sm font-semibold">
            {pct}% Present
          </Badge>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16 text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : holiday ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <PartyPopper className="size-8 text-success" />
            <p className="text-sm font-semibold text-text">{holiday.name}</p>
            <p className="text-sm text-muted">School is closed — attendance is not taken on a holiday.</p>
          </div>
        ) : !className || !section ? (
          <div className="py-16 text-center text-sm text-muted">
            Select a class and section to take attendance.
          </div>
        ) : roster.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">
            No students in {className} · Section {section}. Add students first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {roster.map((s) => {
              const st = statusOf(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                  <div className="gradient-indigo flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{s.name}</p>
                    <p className="mt-0.5 text-[11px] text-subtle">Roll #{s.roll}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", statusConfig[st].bar)}
                      aria-hidden
                    />
                    <div className="w-32">
                      <Select
                        value={st}
                        onChange={(e) => mark(s.id, e.target.value as AttendanceStatus)}
                        options={STATUS_OPTIONS}
                        aria-label={`Attendance status for ${s.name}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!holiday && (
          <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-4">
            {!dirty && !loading && roster.length > 0 && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-success-text">
                <Check className="size-4" />
                Saved
              </p>
            )}
            <Button
              variant="outline"
              onClick={handleNotify}
              disabled={notifying || saving || loading || savedAbsentCount === 0}
              title={
                savedAbsentCount === 0
                  ? "No saved absentees to notify"
                  : "Email the parents of today's saved absentees"
              }
            >
              {notifying ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
              Notify parents{savedAbsentCount > 0 ? ` (${savedAbsentCount})` : ""}
            </Button>
            <Button onClick={handleSave} disabled={saving || loading || roster.length === 0}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Attendance
            </Button>
          </div>
        )}
      </Card>

      <Modal
        open={reportOpen}
        onOpenChange={setReportOpen}
        title="Monthly report"
        description="Attendance register for the selected month"
        size="xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={handleExportReportCsv}
              disabled={reportLoading || reportRows.length === 0}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportReportPdf}
              disabled={reportLoading || reportRows.length === 0}
            >
              <FileText className="size-4" />
              Export PDF
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="month"
              value={reportMonth}
              max={currentMonth()}
              onChange={(e) => setReportMonth(e.target.value)}
              className="focus-ring h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-text"
              aria-label="Report month"
            />
            {className && section ? (
              <p className="text-xs text-muted">
                {className} · Section {section}
                {reportDays > 0 ? ` · ${reportDays} day(s) recorded` : ""}
              </p>
            ) : null}
            {!reportLoading && !reportError && reportRows.length > 0 && (
              <Badge
                variant={reportOverallPct >= 90 ? "success" : reportOverallPct >= 75 ? "warning" : "danger"}
                className="ml-auto px-3 py-1 text-sm font-semibold"
              >
                {reportOverallPct}% overall
              </Badge>
            )}
          </div>

          {!className || !section ? (
            <div className="py-12 text-center text-sm text-muted">
              Select a class and section on the page to view its register.
            </div>
          ) : reportLoading ? (
            <div className="grid place-items-center py-12 text-muted">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : reportError ? (
            <div className="py-12 text-center text-sm text-danger-text">
              Could not load the report. Please try again.
            </div>
          ) : reportRows.length === 0 ? (
            <EmptyState
              title="No students"
              description={`No active students in ${className} · Section ${section}.`}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-xs uppercase tracking-wide text-subtle">
                    <th className="px-3 py-2.5 font-semibold">Roll</th>
                    <th className="px-3 py-2.5 font-semibold">Student</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Present</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Absent</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Late</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Half-day</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Leave</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Total</th>
                    <th className="px-3 py-2.5 text-right font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((s) => (
                    <tr key={s.studentId} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-muted">{s.roll}</td>
                      <td className="px-3 py-2 font-medium text-text">{s.studentName}</td>
                      <td className="px-3 py-2 text-center text-success-text">{s.present}</td>
                      <td className="px-3 py-2 text-center text-danger-text">{s.absent}</td>
                      <td className="px-3 py-2 text-center text-warning-text">{s.late}</td>
                      <td className="px-3 py-2 text-center text-info-text">{s.halfDay}</td>
                      <td className="px-3 py-2 text-center text-violet-text">{s.leave}</td>
                      <td className="px-3 py-2 text-center text-muted">{s.total}</td>
                      <td className="px-3 py-2 text-right font-semibold text-text">{s.percent}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-surface-sunken font-semibold text-text">
                    <td className="px-3 py-2.5" colSpan={2}>
                      {reportRows.length} student(s)
                    </td>
                    <td className="px-3 py-2.5 text-center">{reportTotals.present}</td>
                    <td className="px-3 py-2.5 text-center">{reportTotals.absent}</td>
                    <td className="px-3 py-2.5 text-center">{reportTotals.late}</td>
                    <td className="px-3 py-2.5 text-center">{reportTotals.halfDay}</td>
                    <td className="px-3 py-2.5 text-center">{reportTotals.leave}</td>
                    <td className="px-3 py-2.5 text-center">{reportTotals.total}</td>
                    <td className="px-3 py-2.5 text-right">{reportOverallPct}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
