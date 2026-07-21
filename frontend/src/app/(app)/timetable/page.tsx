"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, Clock } from "lucide-react";
import { Button, Card, CardContent, PageHeader } from "@/components/ui";
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

const timetableData: Record<string, Record<number, TimetableEntry>> = {
  Monday:    { 1: { subject: "Mathematics", teacher: "Dr. Priya" }, 2: { subject: "Physics", teacher: "Mr. Rahul" }, 3: { subject: "English", teacher: "Ms. Anita" }, 5: { subject: "Chemistry", teacher: "Ms. Kavita" }, 6: { subject: "History", teacher: "Mr. Suresh" }, 8: { subject: "Computer Science", teacher: "Mr. Amit" }, 9: { subject: "Physical Education", teacher: "Mr. Vikram" }, 10: { subject: "Free Period", teacher: "" } },
  Tuesday:   { 1: { subject: "English", teacher: "Ms. Anita" }, 2: { subject: "Mathematics", teacher: "Dr. Priya" }, 3: { subject: "Biology", teacher: "Ms. Deepa" }, 5: { subject: "Hindi", teacher: "Mr. Suresh" }, 6: { subject: "Physics", teacher: "Mr. Rahul" }, 8: { subject: "Geography", teacher: "Mr. Suresh" }, 9: { subject: "Chemistry", teacher: "Ms. Kavita" }, 10: { subject: "Mathematics", teacher: "Dr. Priya" } },
  Wednesday: { 1: { subject: "Physics", teacher: "Mr. Rahul" }, 2: { subject: "Chemistry", teacher: "Ms. Kavita" }, 3: { subject: "Mathematics", teacher: "Dr. Priya" }, 5: { subject: "English", teacher: "Ms. Anita" }, 6: { subject: "Computer Science", teacher: "Mr. Amit" }, 8: { subject: "Biology", teacher: "Ms. Deepa" }, 9: { subject: "Hindi", teacher: "Mr. Suresh" }, 10: { subject: "Physical Education", teacher: "Mr. Vikram" } },
  Thursday:  { 1: { subject: "Hindi", teacher: "Mr. Suresh" }, 2: { subject: "Biology", teacher: "Ms. Deepa" }, 3: { subject: "Physics", teacher: "Mr. Rahul" }, 5: { subject: "Mathematics", teacher: "Dr. Priya" }, 6: { subject: "Geography", teacher: "Mr. Suresh" }, 8: { subject: "English", teacher: "Ms. Anita" }, 9: { subject: "Chemistry", teacher: "Ms. Kavita" }, 10: { subject: "Free Period", teacher: "" } },
  Friday:    { 1: { subject: "Chemistry", teacher: "Ms. Kavita" }, 2: { subject: "English", teacher: "Ms. Anita" }, 3: { subject: "Hindi", teacher: "Mr. Suresh" }, 5: { subject: "Physics", teacher: "Mr. Rahul" }, 6: { subject: "Mathematics", teacher: "Dr. Priya" }, 8: { subject: "Computer Science", teacher: "Mr. Amit" }, 9: { subject: "Biology", teacher: "Ms. Deepa" }, 10: { subject: "Geography", teacher: "Mr. Suresh" } },
  Saturday:  { 1: { subject: "Physical Education", teacher: "Mr. Vikram" }, 2: { subject: "Computer Science", teacher: "Mr. Amit" }, 3: { subject: "Free Period", teacher: "" }, 5: null, 6: null, 8: null, 9: null, 10: null },
};

const classes = ["6-A", "6-B", "7-A", "8-A", "9-A", "9-B", "10-A", "10-B", "11-A", "12-A"];
const todayIndex = Math.min(new Date().getDay() - 1, 5);

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [highlightDay, setHighlightDay] = useState<string | null>(days[todayIndex] ?? "Monday");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Timetable"
        description="Weekly class schedule & period management"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export PDF
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
            <Button variant="outline" size="sm" aria-label="Previous week" className="px-2">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="whitespace-nowrap text-sm font-medium text-text">
              Week of Jul 14 – Jul 19, 2025
            </span>
            <Button variant="outline" size="sm" aria-label="Next week" className="px-2">
              <ChevronRight className="size-4" />
            </Button>
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
                {days.map((day) => {
                  const isToday = day === (days[todayIndex] ?? "");
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
                        P{period.id > 4 ? period.id - 1 : period.id}
                      </div>
                      <div className="mt-0.5 text-[10px] text-subtle">{period.time}</div>
                    </td>

                    {days.map((day) => {
                      const entry = timetableData[day]?.[period.id];
                      const isToday = day === (days[todayIndex] ?? "");
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
