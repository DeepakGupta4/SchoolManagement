"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, Circle, Clock, BookOpen, Download, Plus } from "lucide-react";
import { Badge, Button, Card, CardContent, PageHeader, Select, useToast } from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";
import { useResource } from "@/hooks/useResource";
import { syllabusApi, type SyllabusChapter } from "@/lib/api/syllabus";

type ChapterStatus = "completed" | "in-progress" | "pending";

type Chapter = {
  name: string;
  status: ChapterStatus;
  topics: number;
  completedTopics: number;
  date: string;
};

type Unit = { unit: string; chapters: Chapter[] };

type SubjectSyllabus = {
  subject: string;
  teacher: string;
  units: Unit[];
  totalChapters: number;
  completedChapters: number;
};

/** The tree flattened to one row per chapter, for CSV export. */
type ChapterRow = {
  subject: string;
  teacher: string;
  unit: string;
  chapter: Chapter;
};

/**
 * Rebuilds the per-subject syllabus tree from flat chapter rows: chapters are
 * grouped under their unit (in first-seen order) and units under their subject.
 * Every counter on the page is derived from the chapter statuses that come back.
 */
function buildSyllabus(rows: SyllabusChapter[]): SubjectSyllabus[] {
  const subjects: SubjectSyllabus[] = [];
  const subjectIndex = new Map<string, SubjectSyllabus>();
  const unitIndex = new Map<string, Unit>();

  for (const row of rows) {
    let subject = subjectIndex.get(row.subject);
    if (!subject) {
      subject = {
        subject: row.subject,
        teacher: row.teacher,
        units: [],
        totalChapters: 0,
        completedChapters: 0,
      };
      subjectIndex.set(row.subject, subject);
      subjects.push(subject);
    }

    const unitKey = `${row.subject}::${row.unit}`;
    let unit = unitIndex.get(unitKey);
    if (!unit) {
      unit = { unit: row.unit, chapters: [] };
      unitIndex.set(unitKey, unit);
      subject.units.push(unit);
    }

    const status = row.status as ChapterStatus;
    unit.chapters.push({
      name: row.chapter,
      status,
      topics: row.topics,
      completedTopics: row.completedTopics,
      date: row.date,
    });
    subject.totalChapters += 1;
    if (status === "completed") subject.completedChapters += 1;
  }

  return subjects;
}

type BadgeVariant = "default" | "success" | "warning";

const statusConfig: Record<string, { variant: BadgeVariant; bar: string; label: string }> = {
  completed:     { variant: "success", bar: "bg-success", label: "Completed"   },
  "in-progress": { variant: "warning", bar: "bg-warning", label: "In Progress" },
  pending:       { variant: "default", bar: "bg-border-strong", label: "Pending" },
};

/** Subject accents come from the gradient utility set, not raw hex. */
const subjectTone: Record<string, { tile: string; bar: string; text: string }> = {
  Mathematics:        { tile: "gradient-indigo",  bar: "bg-primary", text: "text-primary" },
  Physics:            { tile: "gradient-violet",  bar: "bg-info",    text: "text-info-text" },
  Chemistry:          { tile: "gradient-emerald", bar: "bg-success", text: "text-success-text" },
  Biology:            { tile: "gradient-cyan",    bar: "bg-info",    text: "text-info-text" },
  Science:            { tile: "gradient-cyan",    bar: "bg-info",    text: "text-info-text" },
  English:            { tile: "gradient-rose",    bar: "bg-danger",  text: "text-danger-text" },
  "Social Studies":   { tile: "gradient-amber",   bar: "bg-warning", text: "text-warning-text" },
  "Computer Science": { tile: "gradient-violet",  bar: "bg-violet",  text: "text-primary" },
};

const FALLBACK_TONE = { tile: "gradient-indigo", bar: "bg-primary", text: "text-primary" };

const ALL_SUBJECTS = "All Subjects";

function StatusIcon({ status, className }: { status: string; className?: string }) {
  if (status === "completed") return <CheckCircle className={cn("text-success", className)} />;
  if (status === "in-progress") return <Clock className={cn("text-warning", className)} />;
  return <Circle className={cn("text-subtle", className)} />;
}

export default function SyllabusPage() {
  const [selClass,   setSelClass]   = useState("10-A");
  const [selSubject, setSelSubject] = useState(ALL_SUBJECTS);
  const [openUnits,  setOpenUnits]  = useState<Record<string, boolean>>({});
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const toggleUnit = (key: string) => setOpenUnits(p => ({ ...p, [key]: !p[key] }));

  // All syllabus rows for the school load once; the class dropdown and the
  // per-subject tree below are derived from them client-side.
  const filters = useMemo(() => ({}), []);
  const { items, loading, error, refetch } = useResource(syllabusApi, filters, {
    label: "chapter",
    describe: (r) => r.chapter,
  });

  const classes = useMemo(
    () =>
      [...new Set(items.map((r) => r.className))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    [items]
  );

  const activeClass = classes.includes(selClass) ? selClass : classes[0] ?? selClass;

  const syllabusData = useMemo(
    () => buildSyllabus(items.filter((r) => r.className === activeClass)),
    [items, activeClass]
  );
  // The subject tabs come from the data, so a class never offers a subject it
  // has no syllabus for. A subject that vanishes on a class switch falls back
  // to "All Subjects" — derived here rather than reset from an effect.
  const subjects = [ALL_SUBJECTS, ...syllabusData.map((s) => s.subject)];
  const activeSubject = subjects.includes(selSubject) ? selSubject : ALL_SUBJECTS;

  const filtered = syllabusData.filter(
    (s) => activeSubject === ALL_SUBJECTS || s.subject === activeSubject
  );

  // Every counter below is derived from the chapter statuses actually on screen.
  const visibleChapters = filtered.flatMap((s) => s.units.flatMap((u) => u.chapters));
  const totalChapters  = visibleChapters.length;
  const completedTotal = visibleChapters.filter((c) => c.status === "completed").length;
  const inProgressTotal = visibleChapters.filter((c) => c.status === "in-progress").length;
  const pendingTotal   = visibleChapters.filter((c) => c.status === "pending").length;
  const overallPct     = totalChapters > 0 ? Math.round((completedTotal / totalChapters) * 100) : 0;

  const overallText =
    overallPct >= 75 ? "text-success-text" : overallPct >= 50 ? "text-warning-text" : "text-danger-text";

  /** Flattens the subjects currently on screen to one row per chapter. */
  const handleExport = () => {
    const rows: ChapterRow[] = filtered.flatMap((s) =>
      s.units.flatMap((u) =>
        u.chapters.map((chapter) => ({
          subject: s.subject,
          teacher: s.teacher,
          unit: u.unit,
          chapter,
        }))
      )
    );

    if (rows.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No chapters match the selected class and subject.",
        variant: "warning",
      });
      return;
    }

    exportToCsv<ChapterRow>(
      `syllabus-class-${activeClass}`,
      [
        { header: "Class", value: () => activeClass },
        { header: "Subject", value: (r) => r.subject },
        { header: "Teacher", value: (r) => r.teacher },
        { header: "Unit", value: (r) => r.unit },
        { header: "Chapter", value: (r) => r.chapter.name },
        { header: "Topics", value: (r) => r.chapter.topics },
        { header: "Topics Completed", value: (r) => r.chapter.completedTopics },
        {
          header: "Progress (%)",
          value: (r) => Math.round((r.chapter.completedTopics / r.chapter.topics) * 100),
        },
        { header: "Status", value: (r) => statusConfig[r.chapter.status].label },
        { header: "Taught On", value: (r) => (r.chapter.date === "—" ? "" : r.chapter.date) },
      ],
      rows
    );
    toast({
      title: "Export ready",
      description: `${rows.length} chapter${rows.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Syllabus Tracker"
        description="Track chapter-wise syllabus completion progress"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
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
              value={activeClass}
              onChange={(e) => setSelClass(e.target.value)}
              options={classes.map((c) => ({ label: `Class ${c}`, value: c }))}
              aria-label="Select class"
            />
            {loading && <span className="text-xs text-muted">Loading…</span>}
          </div>
          <div className="flex flex-wrap gap-1 rounded-md bg-surface-sunken p-1">
            {subjects.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={activeSubject === s ? "primary" : "ghost"}
                onClick={() => setSelSubject(s)}
                className="whitespace-nowrap"
              >
                {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text">
              Syllabus Completion — Class {activeClass}
              {activeSubject !== ALL_SUBJECTS && ` · ${activeSubject}`}
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
              { label: "Total Chapters", value: totalChapters,   dot: "bg-primary" },
              { label: "Completed",      value: completedTotal,  dot: "bg-success" },
              { label: "In Progress",    value: inProgressTotal, dot: "bg-warning" },
              { label: "Pending",        value: pendingTotal,    dot: "bg-border-strong" },
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
        {filtered.map((subj, si) => {
          // First subject of the list starts expanded until the user says otherwise.
          const isSubjOpen = openSubjects[`${activeClass}-${subj.subject}`] ?? si === 0;
          const pct = Math.round((subj.completedChapters / subj.totalChapters) * 100);
          const tone = subjectTone[subj.subject] ?? FALLBACK_TONE;

          return (
            <Card key={subj.subject} className="overflow-hidden">
              <button
                onClick={() =>
                  setOpenSubjects((p) => ({
                    ...p,
                    [`${activeClass}-${subj.subject}`]: !isSubjOpen,
                  }))
                }
                aria-expanded={isSubjOpen}
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
                    const unitKey = `${activeClass}-${subj.subject}-${ui}`;
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
