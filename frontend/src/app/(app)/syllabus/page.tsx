"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, Circle, Clock, BookOpen, Download, Plus } from "lucide-react";
import { Badge, Button, Card, CardContent, PageHeader, Select, useToast } from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";

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

/** A blueprint is the printed syllabus: unit titles and their chapters. */
type UnitPlan = { unit: string; chapters: [name: string, topics: number][] };

const TEACHERS: Record<string, string> = {
  Mathematics: "Dr. Priya Sharma",
  Physics: "Mr. Rahul Verma",
  Chemistry: "Ms. Kavita Singh",
  Biology: "Ms. Deepa Nair",
  Science: "Ms. Deepa Nair",
  English: "Ms. Anita Desai",
  "Social Studies": "Mr. Suresh Rao",
  "Computer Science": "Mr. Amit Khanna",
};

/** Dates are handed out in teaching order to whatever has been covered. */
const TEACHING_DATES = [
  "Apr 5", "Apr 18", "Apr 29", "May 10", "May 22",
  "Jun 2", "Jun 14", "Jun 26", "Jul 8", "Jul 19",
];

const MATH_JUNIOR: UnitPlan[] = [
  { unit: "Unit 1 — Number System", chapters: [["Knowing Our Numbers", 5], ["Whole Numbers", 4], ["Playing with Numbers", 6]] },
  { unit: "Unit 2 — Algebra & Geometry", chapters: [["Basic Geometrical Ideas", 5], ["Introduction to Algebra", 6], ["Ratio and Proportion", 4]] },
  { unit: "Unit 3 — Mensuration", chapters: [["Perimeter and Area", 5], ["Data Handling", 4]] },
];

const MATH_SENIOR: UnitPlan[] = [
  { unit: "Unit 1 — Number Systems", chapters: [["Real Numbers", 6], ["Polynomials", 5]] },
  { unit: "Unit 2 — Algebra", chapters: [["Linear Equations", 7], ["Quadratic Equations", 8], ["Arithmetic Progressions", 6]] },
  { unit: "Unit 3 — Geometry", chapters: [["Triangles", 5], ["Circles", 6], ["Constructions", 4]] },
  { unit: "Unit 4 — Trigonometry", chapters: [["Intro to Trigonometry", 5], ["Applications of Trigonometry", 4]] },
];

const MATH_HIGHER: UnitPlan[] = [
  { unit: "Unit 1 — Calculus", chapters: [["Relations and Functions", 6], ["Continuity & Differentiability", 8], ["Applications of Derivatives", 7]] },
  { unit: "Unit 2 — Integrals", chapters: [["Integrals", 9], ["Applications of Integrals", 5], ["Differential Equations", 6]] },
  { unit: "Unit 3 — Vectors & 3D", chapters: [["Vector Algebra", 6], ["Three Dimensional Geometry", 6]] },
];

const SCIENCE_JUNIOR: UnitPlan[] = [
  { unit: "Unit 1 — Food & Materials", chapters: [["Components of Food", 5], ["Fibre to Fabric", 4], ["Separation of Substances", 5]] },
  { unit: "Unit 2 — The Living World", chapters: [["Getting to Know Plants", 6], ["Body Movements", 5], ["Living Organisms & Habitat", 5]] },
  { unit: "Unit 3 — Motion & Light", chapters: [["Motion and Measurement", 5], ["Light, Shadows & Reflections", 4]] },
];

const SOCIAL_JUNIOR: UnitPlan[] = [
  { unit: "Unit 1 — History", chapters: [["What, Where, How and When?", 4], ["From Hunting to Growing Food", 5], ["In the Earliest Cities", 5]] },
  { unit: "Unit 2 — Geography", chapters: [["The Earth in the Solar System", 5], ["Globe: Latitudes & Longitudes", 4], ["Motions of the Earth", 4]] },
  { unit: "Unit 3 — Civics", chapters: [["Understanding Diversity", 4], ["Local Government", 5]] },
];

const ENGLISH_PLAN: UnitPlan[] = [
  { unit: "Unit 1 — Prose", chapters: [["A Letter to God", 4], ["Nelson Mandela: Long Walk to Freedom", 5], ["Two Stories about Flying", 4]] },
  { unit: "Unit 2 — Poetry", chapters: [["Dust of Snow", 3], ["Fire and Ice", 3], ["The Ball Poem", 4]] },
  { unit: "Unit 3 — Writing & Grammar", chapters: [["Formal Letter Writing", 5], ["Tenses and Voice", 6]] },
];

const PHYSICS_SENIOR: UnitPlan[] = [
  { unit: "Unit 1 — Mechanics", chapters: [["Motion in a Straight Line", 8], ["Laws of Motion", 7], ["Work, Energy & Power", 6]] },
  { unit: "Unit 2 — Thermodynamics", chapters: [["Thermal Properties", 5], ["Thermodynamics", 7], ["Kinetic Theory", 5]] },
  { unit: "Unit 3 — Waves & Optics", chapters: [["Oscillations", 6], ["Waves", 5], ["Light: Reflection & Refraction", 6]] },
];

const PHYSICS_HIGHER: UnitPlan[] = [
  { unit: "Unit 1 — Electrostatics", chapters: [["Electric Charges & Fields", 7], ["Electrostatic Potential", 6], ["Current Electricity", 8]] },
  { unit: "Unit 2 — Magnetism", chapters: [["Moving Charges & Magnetism", 7], ["Magnetism and Matter", 5], ["Electromagnetic Induction", 6]] },
  { unit: "Unit 3 — Modern Physics", chapters: [["Dual Nature of Radiation", 5], ["Atoms and Nuclei", 6], ["Semiconductor Devices", 6]] },
];

const CHEMISTRY_SENIOR: UnitPlan[] = [
  { unit: "Unit 1 — Basic Concepts", chapters: [["Some Basic Concepts of Chemistry", 6], ["Structure of Atom", 8]] },
  { unit: "Unit 2 — Chemical Bonding", chapters: [["Chemical Bonding", 9], ["States of Matter", 6], ["Thermodynamics", 7]] },
  { unit: "Unit 3 — Reactions", chapters: [["Chemical Reactions & Equations", 6], ["Acids, Bases and Salts", 5], ["Metals and Non-metals", 6]] },
];

const CHEMISTRY_HIGHER: UnitPlan[] = [
  { unit: "Unit 1 — Physical Chemistry", chapters: [["Solutions", 6], ["Electrochemistry", 7], ["Chemical Kinetics", 6]] },
  { unit: "Unit 2 — Inorganic Chemistry", chapters: [["The d- and f-Block Elements", 6], ["Coordination Compounds", 7]] },
  { unit: "Unit 3 — Organic Chemistry", chapters: [["Haloalkanes & Haloarenes", 5], ["Alcohols, Phenols & Ethers", 6], ["Biomolecules", 5]] },
];

const BIOLOGY_SENIOR: UnitPlan[] = [
  { unit: "Unit 1 — Cell Biology", chapters: [["The Fundamental Unit of Life", 6], ["Tissues", 5]] },
  { unit: "Unit 2 — Life Processes", chapters: [["Life Processes", 8], ["Control and Coordination", 6], ["How do Organisms Reproduce?", 6]] },
  { unit: "Unit 3 — Heredity & Environment", chapters: [["Heredity and Evolution", 6], ["Our Environment", 4]] },
];

const CS_HIGHER: UnitPlan[] = [
  { unit: "Unit 1 — Programming", chapters: [["Python Revision Tour", 6], ["Functions", 6], ["File Handling", 7]] },
  { unit: "Unit 2 — Data Structures", chapters: [["Stacks", 5], ["Queues", 4], ["Searching & Sorting", 6]] },
  { unit: "Unit 3 — Databases & Networks", chapters: [["Database Concepts", 6], ["SQL Queries", 7], ["Computer Networks", 6]] },
];

/**
 * Turns a blueprint into tracked chapters: the first `completed` chapters are
 * done, the next is in progress, and the rest are still pending. Every counter
 * on the page is then derived from these statuses — nothing is hardcoded.
 */
function buildSubject(subject: string, plans: UnitPlan[], completed: number): SubjectSyllabus {
  let index = 0;

  const units = plans.map(({ unit, chapters }) => ({
    unit,
    chapters: chapters.map(([name, topics]): Chapter => {
      const position = index++;
      const status: ChapterStatus =
        position < completed ? "completed" : position === completed ? "in-progress" : "pending";
      return {
        name,
        status,
        topics,
        completedTopics:
          status === "completed" ? topics : status === "in-progress" ? Math.ceil(topics / 2) : 0,
        date: status === "completed" ? TEACHING_DATES[position % TEACHING_DATES.length] : "—",
      };
    }),
  }));

  const all = units.flatMap((u) => u.chapters);

  return {
    subject,
    teacher: TEACHERS[subject] ?? "Unassigned",
    units,
    totalChapters: all.length,
    completedChapters: all.filter((c) => c.status === "completed").length,
  };
}

/** Every class carries its own syllabus and its own progress through it. */
const syllabusByClass: Record<string, SubjectSyllabus[]> = {
  "6-A": [
    buildSubject("Mathematics", MATH_JUNIOR, 5),
    buildSubject("Science", SCIENCE_JUNIOR, 4),
    buildSubject("Social Studies", SOCIAL_JUNIOR, 3),
    buildSubject("English", ENGLISH_PLAN, 6),
  ],
  "7-A": [
    buildSubject("Mathematics", MATH_JUNIOR, 6),
    buildSubject("Science", SCIENCE_JUNIOR, 6),
    buildSubject("Social Studies", SOCIAL_JUNIOR, 5),
    buildSubject("English", ENGLISH_PLAN, 4),
  ],
  "8-A": [
    buildSubject("Mathematics", MATH_JUNIOR, 7),
    buildSubject("Science", SCIENCE_JUNIOR, 7),
    buildSubject("Social Studies", SOCIAL_JUNIOR, 6),
    buildSubject("English", ENGLISH_PLAN, 7),
  ],
  "9-A": [
    buildSubject("Mathematics", MATH_SENIOR, 6),
    buildSubject("Physics", PHYSICS_SENIOR, 5),
    buildSubject("Chemistry", CHEMISTRY_SENIOR, 4),
    buildSubject("Biology", BIOLOGY_SENIOR, 3),
    buildSubject("English", ENGLISH_PLAN, 5),
  ],
  "10-A": [
    buildSubject("Mathematics", MATH_SENIOR, 9),
    buildSubject("Physics", PHYSICS_SENIOR, 7),
    buildSubject("Chemistry", CHEMISTRY_SENIOR, 8),
    buildSubject("Biology", BIOLOGY_SENIOR, 5),
    buildSubject("English", ENGLISH_PLAN, 6),
  ],
  "11-A": [
    buildSubject("Mathematics", MATH_HIGHER, 4),
    buildSubject("Physics", PHYSICS_HIGHER, 3),
    buildSubject("Chemistry", CHEMISTRY_HIGHER, 5),
    buildSubject("Computer Science", CS_HIGHER, 4),
  ],
  "12-A": [
    buildSubject("Mathematics", MATH_HIGHER, 7),
    buildSubject("Physics", PHYSICS_HIGHER, 6),
    buildSubject("Chemistry", CHEMISTRY_HIGHER, 6),
    buildSubject("Computer Science", CS_HIGHER, 8),
  ],
};

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
const classes = Object.keys(syllabusByClass);

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

  const syllabusData = syllabusByClass[selClass] ?? [];
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
      `syllabus-class-${selClass}`,
      [
        { header: "Class", value: () => selClass },
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

      <Card>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text">
              Syllabus Completion — Class {selClass}
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
          const isSubjOpen = openSubjects[`${selClass}-${subj.subject}`] ?? si === 0;
          const pct = Math.round((subj.completedChapters / subj.totalChapters) * 100);
          const tone = subjectTone[subj.subject] ?? FALLBACK_TONE;

          return (
            <Card key={subj.subject} className="overflow-hidden">
              <button
                onClick={() =>
                  setOpenSubjects((p) => ({
                    ...p,
                    [`${selClass}-${subj.subject}`]: !isSubjOpen,
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
                    const unitKey = `${selClass}-${subj.subject}-${ui}`;
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
