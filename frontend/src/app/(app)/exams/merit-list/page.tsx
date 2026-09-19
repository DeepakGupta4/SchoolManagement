"use client";

import React, { useEffect, useState } from "react";
import {
  Award,
  Crown,
  Download,
  GraduationCap,
  Loader2,
  Medal,
  Percent,
  Search,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useClassOptions } from "@/hooks/useClassOptions";
import { listStudents } from "@/lib/api/students";
import { examsApi } from "@/lib/api/exams";
import { getMarks } from "@/lib/api/marks";
import type { Student as ApiStudent } from "@/types/student";

type MeritStudent = {
  id: string;
  name: string;
  class: string;
  roll: number;
  total: number;
  maxTotal: number;
  pct: number;
  grade: string;
  attendance: number;
};

function gradeFor(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  return "F";
}

/** Grade chip tones, expressed only in semantic tokens. */
const gradeClass: Record<string, string> = {
  "A+": "bg-success-soft text-success-text",
  A: "bg-info-soft text-info-text",
  "B+": "bg-primary-soft text-primary-text",
  B: "bg-warning-soft text-warning-text",
  C: "bg-surface-hover text-muted",
  F: "bg-danger-soft text-danger-text",
};

/** Podium/rank medal styling for the top three, by zero-based position. */
const podiumTile = ["gradient-amber", "bg-border-strong", "gradient-rose"];
const podiumPedestal = [
  "h-24 bg-warning-soft text-warning-text",
  "h-16 bg-surface-hover text-muted",
  "h-12 bg-danger-soft text-danger-text",
];

const toOptions = (values: string[]) => values.map((v) => ({ label: v, value: v }));

export default function MeritListPage() {
  const { toast } = useToast();
  const { classOptions, sectionOptions } = useClassOptions();

  const [search, setSearch] = useState("");
  const [selClass, setSelClass] = useState("");
  const [selSection, setSelSection] = useState("");
  const [selExam, setSelExam] = useState("");

  // Real exams the school created power the exam picker.
  const [examNames, setExamNames] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    examsApi
      .list()
      .then((exams) => {
        if (!cancelled) setExamNames(exams.map((e) => e.name));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!selExam && examNames.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelExam(examNames[0]);
    }
  }, [examNames, selExam]);

  const [cohort, setCohort] = useState<MeritStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Rank students by total marks from real saved marks for the exam-class.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      listStudents({ className: selClass }),
      getMarks(selExam, selClass, selSection),
    ])
      .then(([students, marks]) => {
        if (cancelled) return;
        const roster = (students as ApiStudent[]).filter((s) => s.section === selSection);

        const built: MeritStudent[] = roster
          .map((s) => {
            const own = marks.filter((m) => m.studentId === s.id);
            const total = own.reduce((a, m) => a + m.marks, 0);
            const maxTotal = own.reduce((a, m) => a + (m.maxMarks || 100), 0);
            const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 1000) / 10 : 0;
            return {
              id: s.id,
              name: `${s.firstName} ${s.lastName}`.trim(),
              class: `${s.className} ${s.section}`.trim(),
              roll: Number(s.rollNo) || 0,
              total,
              maxTotal,
              pct,
              grade: gradeFor(pct),
              attendance: Math.round(s.attendancePercent ?? 0),
            };
          })
          // Rank is by total, so it always reflects the cohort on screen.
          .sort((a, b) => b.total - a.total);

        setCohort(built);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Could not load merit list", variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selClass, selSection, selExam, toast]);

  const query = search.trim().toLowerCase();
  const filtered = cohort.filter((s) => !query || s.name.toLowerCase().includes(query));

  const top3 = cohort.slice(0, 3);
  const classAverage =
    cohort.length > 0
      ? (cohort.reduce((a, b) => a + b.pct, 0) / cohort.length).toFixed(1)
      : "0.0";

  const handleExport = () => {
    if (cohort.length === 0) {
      toast({ title: "Nothing to export", variant: "warning" });
      return;
    }
    exportToCsv<MeritStudent>(
      `merit-${selClass}-${selSection}-${selExam}`,
      [
        { header: "Rank", value: (s) => cohort.indexOf(s) + 1 },
        { header: "Student", value: (s) => s.name },
        { header: "Class", value: (s) => s.class },
        { header: "Roll", value: (s) => s.roll },
        { header: "Total", value: (s) => s.total },
        { header: "Max", value: (s) => s.maxTotal },
        { header: "Percentage", value: (s) => s.pct },
        { header: "Grade", value: (s) => s.grade },
        { header: "Attendance", value: (s) => s.attendance },
      ],
      cohort
    );
    toast({ title: "Export ready", description: `${cohort.length} students exported.` });
  };

  const columns: Column<MeritStudent>[] = [
    {
      key: "rank",
      header: "Rank",
      render: (s) => {
        // Rank against the whole cohort, not the search result, so searching
        // for one student still shows their real position.
        const i = cohort.indexOf(s);
        return (
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-md text-xs font-semibold",
              i < 3 ? `${podiumTile[i]} text-white` : "bg-surface-hover text-muted"
            )}
          >
            #{i + 1}
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-subtle">
              Roll #{s.roll} · {s.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (s) => <Badge variant="info">{s.class}</Badge>,
    },
    {
      key: "total",
      header: "Total Marks",
      sortable: true,
      align: "right",
      sortValue: (s) => s.total,
      render: (s) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {s.total}
          <span className="ml-0.5 text-xs font-normal text-subtle">/{s.maxTotal || 0}</span>
        </span>
      ),
    },
    {
      key: "pct",
      header: "Percentage",
      sortable: true,
      sortValue: (s) => s.pct,
      render: (s) => {
        const bar = s.pct >= 75 ? "bg-success" : s.pct >= 50 ? "bg-warning" : "bg-danger";
        const text =
          s.pct >= 75 ? "text-success-text" : s.pct >= 50 ? "text-warning-text" : "text-danger-text";
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
              <div className={cn("h-full rounded-full", bar)} style={{ width: `${s.pct}%` }} />
            </div>
            <span className={cn("text-xs font-semibold", text)}>{s.pct}%</span>
          </div>
        );
      },
    },
    {
      key: "grade",
      header: "Grade",
      sortable: true,
      render: (s) => (
        <Badge className={cn("font-semibold", gradeClass[s.grade])}>{s.grade}</Badge>
      ),
    },
    {
      key: "attendance",
      header: "Attendance",
      sortable: true,
      sortValue: (s) => s.attendance,
      render: (s) => {
        const ok = s.attendance >= 75;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-hover">
              <div
                className={cn("h-full rounded-full", ok ? "bg-success" : "bg-danger")}
                style={{ width: `${s.attendance}%` }}
              />
            </div>
            <span
              className={cn(
                "text-xs font-semibold",
                ok ? "text-success-text" : "text-danger-text"
              )}
            >
              {s.attendance}%
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Merit List"
        description="Top performing students ranked by score"
        actions={
          <Button onClick={handleExport}>
            <Download className="size-4" />
            Download List
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={cohort.length}
          icon={GraduationCap}
          tone="indigo"
        />
        <StatCard
          label="Pass"
          value={cohort.filter((s) => s.grade !== "F").length}
          icon={Award}
          tone="emerald"
        />
        <StatCard
          label="Fail"
          value={cohort.filter((s) => s.grade === "F").length}
          icon={XCircle}
          tone="rose"
        />
        <StatCard label="Class Average" value={`${classAverage}%`} icon={Percent} tone="amber" />
      </div>

      {top3.length === 3 && (
      <Card>
        <CardContent className="py-8">
          <p className="mb-7 text-center text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Top Performers — {selClass} · {selSection} · {selExam}
          </p>
          <div className="flex items-end justify-center gap-5">
            {/* 2nd place */}
            <div className="max-w-44 flex-1 text-center">
              <Avatar name={top3[1].name} size="lg" className="mx-auto" />
              <Medal className="mx-auto mt-1.5 size-5 text-muted" />
              <p className="mt-1 text-sm font-semibold text-text">{top3[1].name}</p>
              <p className="mt-0.5 text-xs text-muted">{top3[1].pct}%</p>
              <p className="text-xs text-subtle">
                {top3[1].total}/{top3[1].maxTotal || 0}
              </p>
              <div
                className={cn(
                  "mt-3 flex items-center justify-center rounded-t-md text-2xl font-semibold",
                  podiumPedestal[1]
                )}
              >
                2
              </div>
            </div>

            {/* 1st place */}
            <div className="max-w-48 flex-1 text-center">
              <Crown className="mx-auto mb-1 size-7 text-warning" />
              <Avatar name={top3[0].name} size="lg" className="mx-auto" />
              <Trophy className="mx-auto mt-1.5 size-5.5 text-warning" />
              <p className="mt-1 text-base font-semibold text-text">{top3[0].name}</p>
              <p className="mt-0.5 text-sm font-semibold text-warning-text">{top3[0].pct}%</p>
              <p className="text-xs text-subtle">
                {top3[0].total}/{top3[0].maxTotal || 0}
              </p>
              <div
                className={cn(
                  "mt-3 flex items-center justify-center rounded-t-md text-3xl font-semibold",
                  podiumPedestal[0]
                )}
              >
                1
              </div>
            </div>

            {/* 3rd place */}
            <div className="max-w-44 flex-1 text-center">
              <Avatar name={top3[2].name} size="lg" className="mx-auto" />
              <Medal className="mx-auto mt-1.5 size-5 text-danger" />
              <p className="mt-1 text-sm font-semibold text-text">{top3[2].name}</p>
              <p className="mt-0.5 text-xs text-danger-text">{top3[2].pct}%</p>
              <p className="text-xs text-subtle">
                {top3[2].total}/{top3[2].maxTotal || 0}
              </p>
              <div
                className={cn(
                  "mt-3 flex items-center justify-center rounded-t-md text-xl font-semibold",
                  podiumPedestal[2]
                )}
              >
                3
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-36">
          <Select
            value={selClass}
            onChange={(e) => setSelClass(e.target.value)}
            placeholder="All classes"
            options={classOptions}
            aria-label="Filter by class"
          />
        </div>
        <div className="w-32">
          <Select
            value={selSection}
            onChange={(e) => setSelSection(e.target.value)}
            placeholder="All sections"
            options={sectionOptions}
            aria-label="Filter by section"
          />
        </div>
        <div className="w-48">
          <Select
            value={selExam}
            onChange={(e) => setSelExam(e.target.value)}
            placeholder="Select exam"
            options={toOptions(examNames)}
            aria-label="Filter by exam"
          />
        </div>
        <div className="min-w-60 max-w-xs flex-1">
          <Input
            type="search"
            placeholder="Search student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search students"
          />
        </div>
        <p className="ml-auto text-xs text-muted">{filtered.length} students</p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : cohort.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          No students in {selClass} · Section {selSection}. Add students first.
        </div>
      ) : (
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(s) => s.id}
          // Top three carry a podium tint so placement reads at a glance.
          // Rank is list position, matching how the Rank column derives it.
          rowClassName={(s) =>
            ["bg-warning-soft", "bg-surface-hover", "bg-danger-soft"][cohort.indexOf(s)]
          }
          emptyTitle="No students found"
          emptyDescription="Try a different search term."
        />
      )}
    </div>
  );
}
