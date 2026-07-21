"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, Circle, Clock, BookOpen, Download, Plus } from "lucide-react";
import { Badge, Button, Card, CardContent, PageHeader, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

const syllabusData = [
  {
    subject: "Mathematics", color: "#6366f1", bg: "#eff6ff", teacher: "Dr. Priya Sharma",
    totalChapters: 15, completedChapters: 9,
    units: [
      {
        unit: "Unit 1 — Number Systems", completed: true,
        chapters: [
          { name: "Real Numbers", status: "completed", topics: 6, completedTopics: 6, date: "Apr 5" },
          { name: "Polynomials", status: "completed", topics: 5, completedTopics: 5, date: "Apr 18" },
        ],
      },
      {
        unit: "Unit 2 — Algebra", completed: false,
        chapters: [
          { name: "Linear Equations", status: "completed", topics: 7, completedTopics: 7, date: "May 10" },
          { name: "Quadratic Equations", status: "in-progress", topics: 8, completedTopics: 5, date: "—" },
          { name: "Arithmetic Progressions", status: "pending", topics: 6, completedTopics: 0, date: "—" },
        ],
      },
      {
        unit: "Unit 3 — Geometry", completed: false,
        chapters: [
          { name: "Triangles", status: "completed", topics: 5, completedTopics: 5, date: "Jun 2" },
          { name: "Circles", status: "in-progress", topics: 6, completedTopics: 3, date: "—" },
          { name: "Constructions", status: "pending", topics: 4, completedTopics: 0, date: "—" },
        ],
      },
      {
        unit: "Unit 4 — Trigonometry", completed: false,
        chapters: [
          { name: "Intro to Trigonometry", status: "pending", topics: 5, completedTopics: 0, date: "—" },
          { name: "Applications of Trigonometry", status: "pending", topics: 4, completedTopics: 0, date: "—" },
        ],
      },
    ],
  },
  {
    subject: "Physics", color: "#8b5cf6", bg: "#f5f3ff", teacher: "Mr. Rahul Verma",
    totalChapters: 12, completedChapters: 7,
    units: [
      {
        unit: "Unit 1 — Mechanics", completed: true,
        chapters: [
          { name: "Motion in a Straight Line", status: "completed", topics: 8, completedTopics: 8, date: "Apr 8" },
          { name: "Laws of Motion", status: "completed", topics: 7, completedTopics: 7, date: "Apr 25" },
          { name: "Work, Energy & Power", status: "completed", topics: 6, completedTopics: 6, date: "May 15" },
        ],
      },
      {
        unit: "Unit 2 — Thermodynamics", completed: false,
        chapters: [
          { name: "Thermal Properties", status: "completed", topics: 5, completedTopics: 5, date: "Jun 5" },
          { name: "Thermodynamics", status: "in-progress", topics: 7, completedTopics: 4, date: "—" },
          { name: "Kinetic Theory", status: "pending", topics: 5, completedTopics: 0, date: "—" },
        ],
      },
    ],
  },
  {
    subject: "Chemistry", color: "#10b981", bg: "#f0fdf4", teacher: "Ms. Kavita Singh",
    totalChapters: 14, completedChapters: 8,
    units: [
      {
        unit: "Unit 1 — Basic Concepts", completed: true,
        chapters: [
          { name: "Some Basic Concepts of Chemistry", status: "completed", topics: 6, completedTopics: 6, date: "Apr 6" },
          { name: "Structure of Atom", status: "completed", topics: 8, completedTopics: 8, date: "Apr 22" },
        ],
      },
      {
        unit: "Unit 2 — Chemical Bonding", completed: false,
        chapters: [
          { name: "Chemical Bonding", status: "completed", topics: 9, completedTopics: 9, date: "May 12" },
          { name: "States of Matter", status: "in-progress", topics: 6, completedTopics: 3, date: "—" },
          { name: "Thermodynamics", status: "pending", topics: 7, completedTopics: 0, date: "—" },
        ],
      },
    ],
  },
];

type BadgeVariant = "default" | "success" | "warning";

const statusConfig: Record<string, { variant: BadgeVariant; bar: string; label: string }> = {
  completed:     { variant: "success", bar: "bg-success", label: "Completed"   },
  "in-progress": { variant: "warning", bar: "bg-warning", label: "In Progress" },
  pending:       { variant: "default", bar: "bg-border-strong", label: "Pending" },
};

/** Subject accents come from the gradient utility set, not raw hex. */
const subjectTone: Record<string, { tile: string; bar: string; text: string }> = {
  Mathematics: { tile: "gradient-indigo", bar: "bg-primary", text: "text-primary" },
  Physics:     { tile: "gradient-violet", bar: "bg-info",    text: "text-info-text" },
  Chemistry:   { tile: "gradient-emerald", bar: "bg-success", text: "text-success-text" },
};

const FALLBACK_TONE = { tile: "gradient-indigo", bar: "bg-primary", text: "text-primary" };

const classes  = ["6-A", "7-A", "8-A", "9-A", "10-A", "11-A", "12-A"];
const subjects = ["All Subjects", "Mathematics", "Physics", "Chemistry", "English", "Biology"];

function StatusIcon({ status, className }: { status: string; className?: string }) {
  if (status === "completed") return <CheckCircle className={cn("text-success", className)} />;
  if (status === "in-progress") return <Clock className={cn("text-warning", className)} />;
  return <Circle className={cn("text-subtle", className)} />;
}

export default function SyllabusPage() {
  const [selClass,   setSelClass]   = useState("10-A");
  const [selSubject, setSelSubject] = useState("All Subjects");
  const [openUnits,  setOpenUnits]  = useState<Record<string, boolean>>({});
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({ Mathematics: true });

  const toggleUnit    = (key: string) => setOpenUnits(p => ({ ...p, [key]: !p[key] }));
  const toggleSubject = (key: string) => setOpenSubjects(p => ({ ...p, [key]: !p[key] }));

  const filtered = syllabusData.filter(s => selSubject === "All Subjects" || s.subject === selSubject);

  const totalChapters   = syllabusData.reduce((a, s) => a + s.totalChapters, 0);
  const completedTotal  = syllabusData.reduce((a, s) => a + s.completedChapters, 0);
  const overallPct      = Math.round((completedTotal / totalChapters) * 100);

  const overallText =
    overallPct >= 75 ? "text-success-text" : overallPct >= 50 ? "text-warning-text" : "text-danger-text";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Syllabus Tracker"
        description="Track chapter-wise syllabus completion progress"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add Chapter
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select
              value={selClass}
              onChange={(e) => setSelClass(e.target.value)}
              options={classes.map((c) => ({ label: `Class ${c}`, value: c }))}
              aria-label="Select class"
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-md bg-surface-sunken p-1">
            {subjects.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={selSubject === s ? "primary" : "ghost"}
                onClick={() => setSelSubject(s)}
                className="whitespace-nowrap"
              >
                {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text">
              Overall Syllabus Completion — {selClass}
            </p>
            <span className={cn("text-xl font-semibold", overallText)}>{overallPct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2">
            {[
              { label: "Total Chapters", value: totalChapters,                       dot: "bg-primary" },
              { label: "Completed",      value: completedTotal,                      dot: "bg-success" },
              { label: "In Progress",    value: totalChapters - completedTotal - 8,  dot: "bg-warning" },
              { label: "Pending",        value: 8,                                   dot: "bg-border-strong" },
            ].map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn("size-2 rounded-full", s.dot)} />
                {s.label}:
                <span className="font-semibold text-text">{s.value}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => {
          const pct = Math.round((s.completedChapters / s.totalChapters) * 100);
          const tone = subjectTone[s.subject] ?? FALLBACK_TONE;
          return (
            <Card key={s.subject}>
              <CardContent>
                <div className="mb-3.5 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-sm",
                      tone.tile
                    )}
                  >
                    <BookOpen className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{s.subject}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">{s.teacher}</p>
                  </div>
                  <span className={cn("text-base font-semibold", tone.text)}>{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={cn("h-full rounded-full", tone.bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  {s.completedChapters} of {s.totalChapters} chapters completed
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((subj) => {
          const isSubjOpen = openSubjects[subj.subject];
          const pct = Math.round((subj.completedChapters / subj.totalChapters) * 100);
          const tone = subjectTone[subj.subject] ?? FALLBACK_TONE;

          return (
            <Card key={subj.subject} className="overflow-hidden">
              <button
                onClick={() => toggleSubject(subj.subject)}
                aria-expanded={Boolean(isSubjOpen)}
                className="focus-ring flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-surface-hover"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-md text-white",
                    tone.tile
                  )}
                >
                  <BookOpen className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{subj.subject}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="h-1.5 w-30 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className={cn("h-full rounded-full", tone.bar)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">
                      {subj.completedChapters}/{subj.totalChapters} chapters · {pct}%
                    </span>
                  </div>
                </div>
                {isSubjOpen ? (
                  <ChevronDown className="size-4.5 shrink-0 text-subtle" />
                ) : (
                  <ChevronRight className="size-4.5 shrink-0 text-subtle" />
                )}
              </button>

              {isSubjOpen && (
                <div className="border-t border-border">
                  {subj.units.map((unit, ui) => {
                    const unitKey = `${subj.subject}-${ui}`;
                    const isUnitOpen = openUnits[unitKey] !== false;
                    const unitCompleted = unit.chapters.every((c) => c.status === "completed");
                    const unitInProgress = unit.chapters.some((c) => c.status === "in-progress");
                    const unitStatus = unitCompleted
                      ? "completed"
                      : unitInProgress
                        ? "in-progress"
                        : "pending";

                    return (
                      <div key={unitKey} className="border-b border-border last:border-0">
                        <button
                          onClick={() => toggleUnit(unitKey)}
                          aria-expanded={isUnitOpen}
                          className="focus-ring flex w-full items-center gap-2.5 bg-surface-sunken py-3.5 pl-7 pr-5 text-left transition-colors hover:bg-surface-hover"
                        >
                          <StatusIcon status={unitStatus} className="size-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                            {unit.unit}
                          </span>
                          <span className="shrink-0 text-[11px] text-subtle">
                            {unit.chapters.length} chapters
                          </span>
                          {isUnitOpen ? (
                            <ChevronDown className="size-3.5 shrink-0 text-subtle" />
                          ) : (
                            <ChevronRight className="size-3.5 shrink-0 text-subtle" />
                          )}
                        </button>

                        {isUnitOpen && (
                          <div>
                            {unit.chapters.map((ch, ci) => {
                              const sc = statusConfig[ch.status];
                              const chPct = Math.round((ch.completedTopics / ch.topics) * 100);
                              return (
                                <div
                                  key={`${unitKey}-${ci}`}
                                  className="flex flex-wrap items-center gap-3 border-t border-border py-3 pl-13 pr-5 transition-colors hover:bg-surface-hover"
                                >
                                  <StatusIcon status={ch.status} className="size-4 shrink-0" />
                                  <p className="min-w-0 flex-1 truncate text-sm text-text">
                                    {ch.name}
                                  </p>

                                  <div className="flex items-center gap-2">
                                    <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-hover">
                                      <div
                                        className={cn("h-full rounded-full", sc.bar)}
                                        style={{ width: `${chPct}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] text-subtle">
                                      {ch.completedTopics}/{ch.topics}
                                    </span>
                                  </div>

                                  {ch.date !== "—" && (
                                    <span className="w-13 text-right text-[11px] text-subtle">
                                      {ch.date}
                                    </span>
                                  )}

                                  <Badge variant={sc.variant}>{sc.label}</Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
