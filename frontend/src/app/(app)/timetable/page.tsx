"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, Clock } from "lucide-react";
import { Button, Card, CardContent, PageHeader, useToast } from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [
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

/**
 * Subjects are keyed onto the semantic status palette instead of bespoke hex.
 * The tile text colour drives the legend dot too (`bg-current`), so a subject
 * only ever needs one entry here.
 */
const subjectTone: Record<string, string> = {
  Mathematics: "bg-primary-soft text-primary-text border-primary",
  Physics: "bg-info-soft text-info-text border-info",
  Chemistry: "bg-success-soft text-success-text border-success",
  Biology: "bg-warning-soft text-warning-text border-warning",
  English: "bg-danger-soft text-danger-text border-danger",
  History: "bg-primary-soft text-primary-text border-primary",
  Geography: "bg-info-soft text-info-text border-info",
  "Computer Science": "bg-success-soft text-success-text border-success",
  "Physical Education": "bg-warning-soft text-warning-text border-warning",
  Hindi: "bg-danger-soft text-danger-text border-danger",
  "Free Period": "bg-surface-hover text-muted border-border",
};

type TimetableEntry = { subject: string; teacher: string } | null;

/** The weekly grid flattened to one row per scheduled slot, for CSV export. */
type SlotRow = {
  day: string;
  period: string;
  time: string;
  subject: string;
  teacher: string;
};

/** Whoever owns a subject across the school — keeps a subject's teacher stable. */
const subjectTeacher: Record<string, string> = {
  Mathematics: "Dr. Priya",
  Physics: "Mr. Rahul",
  Chemistry: "Ms. Kavita",
  Biology: "Ms. Deepa",
  English: "Ms. Anita",
  History: "Mr. Suresh",
  Geography: "Mr. Suresh",
  "Computer Science": "Mr. Amit",
  "Physical Education": "Mr. Vikram",
  Hindi: "Mrs. Latha",
  "Free Period": "",
};

/** Teaching slots — the break rows (4 and 7) carry no subject. */
const teachingPeriods = periods.filter((p) => !p.isBreak).map((p) => p.id);

/** The label shown in the Time column: breaks don't consume a period number. */
const periodLabel = (id: number) => `P${id > 4 ? id - 1 : id}`;

/**
 * Each class has its own weekly subject load. Slot order is the Monday
 * running order; later days rotate it so no two days repeat, which is how a
 * real rotating school timetable is built.
 */
const classPlans: Record<string, string[]> = {
  "6-A": ["Mathematics", "English", "Hindi", "Biology", "Geography", "History", "Physical Education", "Computer Science"],
  "6-B": ["English", "Mathematics", "Biology", "Hindi", "History", "Physical Education", "Geography", "Free Period"],
  "7-A": ["Mathematics", "Biology", "English", "History", "Hindi", "Geography", "Computer Science", "Physical Education"],
  "8-A": ["Biology", "Mathematics", "English", "Physics", "Hindi", "Geography", "Computer Science", "History"],
  "9-A": ["Mathematics", "Physics", "Chemistry", "English", "Biology", "Hindi", "Computer Science", "Physical Education"],
  "9-B": ["Physics", "Mathematics", "English", "Chemistry", "Hindi", "Biology", "History", "Computer Science"],
  "10-A": ["Mathematics", "Physics", "English", "Chemistry", "History", "Computer Science", "Physical Education", "Free Period"],
  "10-B": ["English", "Chemistry", "Mathematics", "Physics", "Biology", "Hindi", "Geography", "Computer Science"],
  "11-A": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Science", "Free Period", "Physical Education"],
  "12-A": ["Mathematics", "Chemistry", "Physics", "Computer Science", "Biology", "English", "Free Period", "Free Period"],
};

const classes = Object.keys(classPlans);

/** Saturday is a half day — only the first four teaching slots run. */
const SATURDAY_SLOTS = 4;

function buildWeek(plan: string[]): Record<string, Record<number, TimetableEntry>> {
  const week: Record<string, Record<number, TimetableEntry>> = {};

  days.forEach((day, dayIndex) => {
    const isSaturday = dayIndex === days.length - 1;
    const row: Record<number, TimetableEntry> = {};

    teachingPeriods.forEach((periodId, slot) => {
      if (isSaturday && slot >= SATURDAY_SLOTS) {
        row[periodId] = null;
        return;
      }
      // Offset of 3 is coprime with an 8-slot plan, so every weekday is a
      // different running order rather than the same list shifted by one.
      const subject = plan[(slot + dayIndex * 3) % plan.length];
      row[periodId] = { subject, teacher: subjectTeacher[subject] ?? "" };
    });

    week[day] = row;
  });

  return week;
}

const timetableByClass: Record<string, Record<string, Record<number, TimetableEntry>>> =
  Object.fromEntries(Object.entries(classPlans).map(([cls, plan]) => [cls, buildWeek(plan)]));

const todayIndex = Math.min(new Date().getDay() - 1, 5);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Monday of the week containing `from`, shifted by `weekOffset` whole weeks. */
function mondayOf(from: Date, weekOffset: number) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  // getDay(): Sunday is 0, and Sunday belongs to the week that just ended.
  const backToMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - backToMonday + weekOffset * 7);
  return d;
}

const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Explicit formatting — locale-dependent output would risk a hydration mismatch. */
const shortDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [highlightDay, setHighlightDay] = useState<string | null>(days[todayIndex] ?? "Monday");
  const [weekOffset, setWeekOffset] = useState(0);

  const timetableData = timetableByClass[selectedClass] ?? {};

  const weekStart = mondayOf(new Date(), weekOffset);
  const weekEnd = addDays(weekStart, days.length - 1);
  const weekLabel = `Week of ${shortDate(weekStart)} – ${shortDate(weekEnd)}, ${weekEnd.getFullYear()}`;

  // "Today" only means anything while the current week is on screen.
  const todayName = weekOffset === 0 ? days[todayIndex] ?? "" : "";

  const { toast } = useToast();

  /**
   * Flattens the grid for the selected class into one row per scheduled slot,
   * in reading order (day by day, period by period). Break rows and the empty
   * Saturday-afternoon slots carry no lesson, so they are left out.
   */
  const handleExport = () => {
    const rows: SlotRow[] = days.flatMap((day) =>
      periods
        .filter((p) => !p.isBreak)
        .flatMap((period) => {
          const entry = timetableData[day]?.[period.id];
          if (!entry) return [];
          return [
            {
              day,
              period: periodLabel(period.id),
              time: period.time,
              subject: entry.subject,
              teacher: entry.teacher,
            },
          ];
        })
    );

    if (rows.length === 0) {
      toast({
        title: "Nothing to export",
        description: `Class ${selectedClass} has no scheduled periods.`,
        variant: "warning",
      });
      return;
    }

    exportToCsv<SlotRow>(
      `timetable-class-${selectedClass}`,
      [
        { header: "Day", value: (r) => r.day },
        { header: "Period", value: (r) => r.period },
        { header: "Time", value: (r) => r.time },
        { header: "Subject", value: (r) => r.subject },
        { header: "Teacher", value: (r) => r.teacher },
      ],
      rows
    );
    toast({
      title: "Export ready",
      description: `${rows.length} period${rows.length === 1 ? "" : "s"} for class ${selectedClass} exported to CSV.`,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Timetable"
        description="Weekly class schedule & period management"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button>
              <Plus className="size-4" />
              Edit Timetable
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted">Class:</span>
            <div className="flex flex-wrap gap-1.5">
              {classes.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={selectedClass === c ? "primary" : "secondary"}
                  onClick={() => setSelectedClass(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Previous week"
              className="px-2"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="whitespace-nowrap text-sm font-medium text-text">{weekLabel}</span>
            <Button
              variant="outline"
              size="sm"
              aria-label="Next week"
              className="px-2"
              onClick={() => setWeekOffset((w) => w + 1)}
            >
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken">
                <th
                  scope="col"
                  className="w-28 border-r border-border px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                >
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
                      <div className="mt-0.5 text-[10px] font-normal text-subtle">
                        {shortDate(addDays(weekStart, dayIndex))}
                      </div>
                      {isToday && (
                        <div className="mt-0.5 text-[10px] font-semibold text-primary">Today</div>
                      )}
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
                      <div className="text-[11px] font-semibold text-muted">
                        {periodLabel(period.id)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-subtle">{period.time}</div>
                    </td>

                    {days.map((day) => {
                      const entry = timetableData[day]?.[period.id];
                      const isToday = day === todayName;
                      const isHighlighted = highlightDay === day;
                      const tone = entry
                        ? subjectTone[entry.subject] ?? subjectTone["Free Period"]
                        : null;

                      return (
                        <td
                          key={day}
                          className={cn(
                            "min-w-32 border-r border-border p-2 align-middle transition-colors",
                            isToday
                              ? "bg-primary-soft/40"
                              : isHighlighted
                                ? "bg-surface-hover"
                                : undefined
                          )}
                        >
                          {entry && tone ? (
                            <div
                              className={cn(
                                "cursor-pointer rounded-sm border px-2.5 py-2 transition-transform hover:scale-[1.02]",
                                tone
                              )}
                            >
                              <p className="text-xs font-semibold leading-tight">{entry.subject}</p>
                              {entry.teacher && (
                                <p className="mt-0.5 text-[10px] text-muted">{entry.teacher}</p>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-sm border border-dashed border-border bg-surface-sunken px-2.5 py-2 text-center">
                              <span className="text-[10px] text-subtle">—</span>
                            </div>
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

      <Card>
        <CardContent>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Subject Legend
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(subjectTone)
              .filter(([k]) => k !== "Free Period")
              .map(([subject, tone]) => (
                <span
                  key={subject}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                    tone
                  )}
                >
                  <span className="size-2 rounded-full bg-current" />
                  {subject}
                </span>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
