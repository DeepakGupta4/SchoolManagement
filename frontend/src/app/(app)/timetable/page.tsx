"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Clock, Trash2, Loader2 } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  useToast,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";
import { useResource } from "@/hooks/useResource";
import { timetableApi, type TimetableEntry } from "@/lib/api/timetable";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName, type Teacher } from "@/types/teacher";
import { getMySchool, updateMySchool } from "@/lib/api/schools";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Period = { id: number; time: string; isBreak?: boolean; label?: string };

// Built-in fallback bell schedule, used when the school has no saved one.
const DEFAULT_PERIODS: Period[] = [
  { id: 1, time: "8:00 - 8:45" },
  { id: 2, time: "8:45 - 9:30" },
  { id: 3, time: "9:30 - 10:15" },
  { id: 4, time: "10:15 - 10:30", isBreak: true, label: "Short Break" },
  { id: 5, time: "10:30 - 11:15" },
  { id: 6, time: "11:15 - 12:00" },
  { id: 7, time: "12:00 - 12:45", isBreak: true, label: "Lunch Break" },
  { id: 8, time: "12:45 - 1:30" },
  { id: 9, time: "1:30 - 2:15" },
  { id: 10, time: "2:15 - 3:00" },
];

// A rotating, theme-safe palette so any subject gets a consistent colour.
const TONES = [
  "bg-primary-soft text-primary-text border-primary",
  "bg-info-soft text-info-text border-info",
  "bg-success-soft text-success-text border-success",
  "bg-warning-soft text-warning-text border-warning",
  "bg-danger-soft text-danger-text border-danger",
  "bg-violet-soft text-violet-text border-violet",
];
function toneFor(subject: string) {
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

// Maps each non-break period id to its display label (P1, P2, …), skipping
// breaks so the numbering stays sequential regardless of where breaks sit.
function buildPeriodLabels(list: Period[]): Record<number, string> {
  const labels: Record<number, string> = {};
  let n = 0;
  for (const p of list) {
    if (p.isBreak) continue;
    n += 1;
    labels[p.id] = `P${n}`;
  }
  return labels;
}

const todayIndex = Math.min(new Date().getDay() - 1, 5);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function mondayOf(from: Date, weekOffset: number) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const backToMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - backToMonday + weekOffset * 7);
  return d;
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const shortDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

type SlotRow = { day: string; period: string; time: string; subject: string; teacher: string };

export default function TimetablePage() {
  const { toast } = useToast();
  const { classOptions, sectionOptions } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();

  const [classSel, setClassSel] = useState("");
  const [sectionSel, setSectionSel] = useState("");
  const [highlightDay, setHighlightDay] = useState<string | null>(days[todayIndex] ?? "Monday");
  const [weekOffset, setWeekOffset] = useState(0);

  // Effective bell schedule: the school's saved one, or the built-in default.
  const [periods, setPeriods] = useState<Period[]>(DEFAULT_PERIODS);
  useEffect(() => {
    let cancelled = false;
    getMySchool()
      .then((school) => {
        if (cancelled || !school) return;
        const bs = school.bellSchedule;
        if (bs && bs.length > 0) {
          setPeriods(bs.map((p, i) => ({ id: i + 1, time: p.time, isBreak: p.isBreak, label: p.label })));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const periodLabels = useMemo(() => buildPeriodLabels(periods), [periods]);
  const periodLabel = (id: number) => periodLabels[id] ?? `P${id}`;

  // ---- Edit bell-schedule timings ----
  const [timingsOpen, setTimingsOpen] = useState(false);
  const [draftPeriods, setDraftPeriods] = useState<Period[]>([]);
  const [savingTimings, setSavingTimings] = useState(false);

  const openTimings = () => {
    setDraftPeriods(periods.map((p) => ({ ...p, label: p.label ?? "", isBreak: Boolean(p.isBreak) })));
    setTimingsOpen(true);
  };

  const saveTimings = async () => {
    setSavingTimings(true);
    try {
      const bellSchedule = draftPeriods.map((p) => ({
        label: p.label ?? "",
        time: p.time ?? "",
        isBreak: Boolean(p.isBreak),
      }));
      await updateMySchool({ bellSchedule });
      setPeriods(bellSchedule.map((p, i) => ({ id: i + 1, time: p.time, isBreak: p.isBreak, label: p.label })));
      toast({ title: "Period timings updated" });
      setTimingsOpen(false);
    } catch {
      toast({ title: "Could not save timings", variant: "error" });
    } finally {
      setSavingTimings(false);
    }
  };

  const activeClass = classSel || classOptions[0]?.value || "";
  const activeSection = sectionSel || sectionOptions[0]?.value || "";
  const classKey = activeClass && activeSection ? `${activeClass} - ${activeSection}` : "";

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    timetableApi,
    useMemo(() => ({}), []),
    { label: "period", describe: (r) => `${r.className} ${r.day} P${r.period}` }
  );

  // Teachers for the assign dropdown.
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  useEffect(() => {
    let cancelled = false;
    listTeachers()
      .then((t) => !cancelled && setTeachers(t))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ label: teacherName(t), value: teacherName(t) })),
    [teachers]
  );

  // Grid for the active class-section: day -> period -> entry (with id).
  const grid = useMemo(() => {
    const g: Record<string, Record<number, TimetableEntry>> = {};
    for (const row of items) {
      if (row.className !== classKey) continue;
      (g[row.day] ??= {})[row.period] = row;
    }
    return g;
  }, [items, classKey]);

  // ---- Assign / edit a single slot ----
  const [cell, setCell] = useState<{ day: string; period: number; time: string } | null>(null);
  const [form, setForm] = useState({ subject: "", teacher: "", room: "" });
  const existing = cell ? grid[cell.day]?.[cell.period] : undefined;

  const openCell = (day: string, period: number, time: string) => {
    if (!classKey) {
      toast({ title: "Pick a class and section first", variant: "warning" });
      return;
    }
    const e = grid[day]?.[period];
    setForm({ subject: e?.subject ?? "", teacher: e?.teacher ?? "", room: e?.room ?? "" });
    setCell({ day, period, time });
  };

  const saveCell = async () => {
    if (!cell || !form.subject) return;
    const values: Omit<TimetableEntry, "id"> = {
      className: classKey,
      day: cell.day,
      period: cell.period,
      time: cell.time,
      subject: form.subject,
      teacher: form.teacher,
      room: form.room,
    };
    const ok = await save(values, existing ?? null);
    if (ok) setCell(null);
  };

  const clearCell = async () => {
    if (!existing) return;
    const ok = await remove(existing);
    if (ok) setCell(null);
  };

  const weekStart = mondayOf(new Date(), weekOffset);
  const weekEnd = addDays(weekStart, days.length - 1);
  const weekLabel = `Week of ${shortDate(weekStart)} – ${shortDate(weekEnd)}, ${weekEnd.getFullYear()}`;
  const todayName = weekOffset === 0 ? days[todayIndex] ?? "" : "";

  const handleExport = () => {
    const rows: SlotRow[] = days.flatMap((day) =>
      periods
        .filter((p) => !p.isBreak)
        .flatMap((period) => {
          const entry = grid[day]?.[period.id];
          if (!entry) return [];
          return [{ day, period: periodLabel(period.id), time: period.time, subject: entry.subject, teacher: entry.teacher }];
        })
    );
    if (rows.length === 0) {
      toast({ title: "Nothing to export", description: `${classKey || "This class"} has no scheduled periods.`, variant: "warning" });
      return;
    }
    exportToCsv<SlotRow>(
      `timetable-${classKey.replace(/\s+/g, "")}`,
      [
        { header: "Day", value: (r) => r.day },
        { header: "Period", value: (r) => r.period },
        { header: "Time", value: (r) => r.time },
        { header: "Subject", value: (r) => r.subject },
        { header: "Teacher", value: (r) => r.teacher },
      ],
      rows
    );
    toast({ title: "Export ready", description: `${rows.length} period(s) for ${classKey} exported.` });
  };

  const noClasses = classOptions.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Timetable"
        description="Weekly class schedule — pick a class, then tap any slot to assign a period."
        actions={
          <>
            <Button variant="outline" onClick={openTimings}>
              <Clock className="size-4" />
              Edit timings
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!classKey}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Select
                label="Class"
                value={activeClass}
                onChange={(e) => setClassSel(e.target.value)}
                placeholder="Select class"
                options={classOptions}
              />
            </div>
            <div className="w-32">
              <Select
                label="Section"
                value={activeSection}
                onChange={(e) => setSectionSel(e.target.value)}
                placeholder="Section"
                options={sectionOptions}
              />
            </div>
            {loading && <span className="pb-2 text-xs text-muted">Loading…</span>}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" aria-label="Previous week" className="px-2" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="whitespace-nowrap text-sm font-medium text-text">{weekLabel}</span>
            <Button variant="outline" size="sm" aria-label="Next week" className="px-2" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="size-4" />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
                This week
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {noClasses ? (
        <Card>
          <EmptyState
            title="No classes yet"
            description="Add classes in Classes & Sections first, then build their timetable here."
          />
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken">
                  <th scope="col" className="w-28 border-r border-border px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Time
                    </span>
                  </th>
                  {days.map((day, dayIndex) => {
                    const isToday = day === todayName;
                    const isHighlighted = highlightDay === day;
                    return (
                      <th
                        key={day}
                        scope="col"
                        onClick={() => setHighlightDay(isHighlighted ? null : day)}
                        className={cn(
                          "cursor-pointer border-r border-border px-3 py-3.5 text-center text-xs font-semibold transition-colors",
                          isToday ? "bg-primary-soft text-primary-text" : "text-text",
                          isHighlighted && !isToday && "bg-surface-hover"
                        )}
                      >
                        <div>{day}</div>
                        <div className="mt-0.5 text-[10px] font-normal text-subtle">{shortDate(addDays(weekStart, dayIndex))}</div>
                        {isToday && <div className="mt-0.5 text-[10px] font-semibold text-primary">Today</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => {
                  if (period.isBreak) {
                    return (
                      <tr key={period.id} className="border-b border-border bg-surface-sunken">
                        <td className="border-r border-border px-5 py-2">
                          <span className="text-[11px] font-medium text-subtle">{period.time}</span>
                        </td>
                        <td colSpan={6} className="px-5 py-2 text-center">
                          <span className="inline-flex items-center rounded-full bg-surface-hover px-3 py-0.5 text-[11px] font-semibold text-muted">
                            ☕ {period.label}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={period.id} className="border-b border-border last:border-0">
                      <td className="border-r border-border px-5 py-2.5 align-middle">
                        <div className="text-[11px] font-semibold text-muted">{periodLabel(period.id)}</div>
                        <div className="mt-0.5 text-[10px] text-subtle">{period.time}</div>
                      </td>
                      {days.map((day) => {
                        const entry = grid[day]?.[period.id];
                        const isToday = day === todayName;
                        const isHighlighted = highlightDay === day;
                        return (
                          <td
                            key={day}
                            className={cn(
                              "min-w-32 border-r border-border p-2 align-middle transition-colors",
                              isToday ? "bg-primary-soft/40" : isHighlighted ? "bg-surface-hover" : undefined
                            )}
                          >
                            {entry ? (
                              <button
                                type="button"
                                onClick={() => openCell(day, period.id, period.time)}
                                className={cn(
                                  "focus-ring w-full cursor-pointer rounded-sm border px-2.5 py-2 text-left transition-transform hover:scale-[1.02]",
                                  toneFor(entry.subject)
                                )}
                              >
                                <p className="text-xs font-semibold leading-tight">{entry.subject}</p>
                                {entry.teacher && <p className="mt-0.5 text-[10px] text-muted">{entry.teacher}</p>}
                                {entry.room && <p className="text-[10px] text-subtle">Room {entry.room}</p>}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openCell(day, period.id, period.time)}
                                className="focus-ring w-full rounded-sm border border-dashed border-border bg-surface-sunken px-2.5 py-2 text-center text-[10px] text-subtle transition-colors hover:border-primary hover:text-primary"
                              >
                                + Add
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Assign / edit a period */}
      <Modal
        open={Boolean(cell)}
        onOpenChange={(o) => !o && setCell(null)}
        title={existing ? "Edit period" : "Assign period"}
        description={cell ? `${classKey} · ${cell.day} · ${periodLabel(cell.period)} (${cell.time})` : ""}
        footer={
          <>
            {existing && (
              <Button variant="danger" onClick={clearCell} disabled={deleting || saving}>
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Clear
              </Button>
            )}
            <Button variant="outline" onClick={() => setCell(null)} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button onClick={saveCell} disabled={saving || deleting || !form.subject}>
              {saving ? "Saving…" : existing ? "Save" : "Assign"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Subject"
            required
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Select subject"
            options={subjectOptions}
          />
          <Select
            label="Teacher"
            value={form.teacher}
            onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}
            placeholder="Select teacher (optional)"
            options={teacherOptions}
          />
          <Input
            label="Room"
            placeholder="e.g. 105 / Science Lab"
            value={form.room}
            onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
          />
          {subjectOptions.length === 0 && (
            <p className="text-xs text-warning-text">
              No subjects yet — add them in the Subjects section for the dropdown.
            </p>
          )}
        </div>
      </Modal>

      {/* Edit period timings (bell schedule) */}
      <Modal
        open={timingsOpen}
        onOpenChange={(o) => !o && setTimingsOpen(false)}
        title="Edit period timings"
        description="Set the label, time and breaks for your school's bell schedule."
        footer={
          <>
            <Button variant="outline" onClick={() => setTimingsOpen(false)} disabled={savingTimings}>
              Cancel
            </Button>
            <Button onClick={saveTimings} disabled={savingTimings}>
              {savingTimings ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {draftPeriods.map((p, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border border-border p-2.5">
              <div className="w-36 grow">
                <Input
                  label={i === 0 ? "Label" : undefined}
                  placeholder={p.isBreak ? "e.g. Lunch Break" : "e.g. Period 1"}
                  value={p.label ?? ""}
                  onChange={(e) =>
                    setDraftPeriods((rows) => rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))
                  }
                />
              </div>
              <div className="w-36 grow">
                <Input
                  label={i === 0 ? "Time" : undefined}
                  placeholder="e.g. 8:00 - 8:45"
                  value={p.time ?? ""}
                  onChange={(e) =>
                    setDraftPeriods((rows) => rows.map((r, j) => (j === i ? { ...r, time: e.target.value } : r)))
                  }
                />
              </div>
              <label className="flex items-center gap-1.5 pb-2.5 text-xs text-muted">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={Boolean(p.isBreak)}
                  onChange={(e) =>
                    setDraftPeriods((rows) => rows.map((r, j) => (j === i ? { ...r, isBreak: e.target.checked } : r)))
                  }
                />
                Break
              </label>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove row"
                className="mb-1 px-2 text-danger"
                onClick={() => setDraftPeriods((rows) => rows.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDraftPeriods((rows) => [...rows, { id: rows.length + 1, time: "", isBreak: false, label: "" }])
            }
          >
            + Add row
          </Button>
        </div>
      </Modal>
    </div>
  );
}
