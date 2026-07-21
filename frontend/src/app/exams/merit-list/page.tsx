"use client";

import React, { useState } from "react";
import {
  Award,
  Crown,
  Download,
  GraduationCap,
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
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const meritData = [
  { id: "S002", name: "Priya Patel",   class: "10-A", roll: 2,  total: 565, pct: 94.2, grade: "A+", attendance: 98 },
  { id: "S006", name: "Ananya Joshi",  class: "10-A", roll: 6,  total: 545, pct: 90.8, grade: "A+", attendance: 96 },
  { id: "S001", name: "Aarav Sharma",  class: "10-A", roll: 1,  total: 524, pct: 87.3, grade: "A",  attendance: 94 },
  { id: "S004", name: "Sneha Gupta",   class: "10-A", roll: 4,  total: 477, pct: 79.5, grade: "B+", attendance: 88 },
  { id: "S007", name: "Vikram Nair",   class: "10-A", roll: 7,  total: 460, pct: 76.7, grade: "B+", attendance: 80 },
  { id: "S008", name: "Meera Iyer",    class: "10-A", roll: 8,  total: 448, pct: 74.7, grade: "B",  attendance: 91 },
  { id: "S009", name: "Arjun Reddy",   class: "10-A", roll: 9,  total: 430, pct: 71.7, grade: "B",  attendance: 87 },
  { id: "S003", name: "Rohan Verma",   class: "10-A", roll: 3,  total: 383, pct: 63.8, grade: "B",  attendance: 72 },
  { id: "S010", name: "Pooja Mishra",  class: "10-A", roll: 10, total: 340, pct: 56.7, grade: "C",  attendance: 60 },
  { id: "S005", name: "Karan Singh",   class: "10-A", roll: 5,  total: 292, pct: 48.7, grade: "F",  attendance: 65 },
];

type MeritStudent = (typeof meritData)[number];

const MAX_TOTAL = 600;

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

const classes = ["All", "6-A", "7-A", "8-A", "9-A", "10-A", "11-A", "12-A"];
const exams   = ["Mid-Term Exam", "Unit Test 1", "Final Exam"];

const toOptions = (values: string[]) => values.map((v) => ({ label: v, value: v }));

export default function MeritListPage() {
  const [search,   setSearch]   = useState("");
  const [selClass, setSelClass] = useState("10-A");
  const [selExam,  setSelExam]  = useState("Mid-Term Exam");

  const filtered = meritData.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const top3 = meritData.slice(0, 3);
  const classAverage = (
    meritData.reduce((a, b) => a + b.pct, 0) / meritData.length
  ).toFixed(1);

  const columns: Column<MeritStudent>[] = [
    {
      key: "rank",
      header: "Rank",
      render: (s) => {
        const i = filtered.indexOf(s);
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
      render: (s) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {s.total}
          <span className="ml-0.5 text-xs font-normal text-subtle">/{MAX_TOTAL}</span>
        </span>
      ),
    },
    {
      key: "pct",
      header: "Percentage",
      sortable: true,
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
          <Button>
            <Download className="size-4" />
            Download List
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={meritData.length}
          icon={GraduationCap}
          tone="indigo"
        />
        <StatCard
          label="Pass"
          value={meritData.filter((s) => s.grade !== "F").length}
          icon={Award}
          tone="emerald"
        />
        <StatCard
          label="Fail"
          value={meritData.filter((s) => s.grade === "F").length}
          icon={XCircle}
          tone="rose"
        />
        <StatCard label="Class Average" value={`${classAverage}%`} icon={Percent} tone="amber" />
      </div>

      <Card>
        <CardContent className="py-8">
          <p className="mb-7 text-center text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Top Performers
          </p>
          <div className="flex items-end justify-center gap-5">
            {/* 2nd place */}
            <div className="max-w-44 flex-1 text-center">
              <Avatar name={top3[1].name} size="lg" className="mx-auto" />
              <Medal className="mx-auto mt-1.5 size-5 text-muted" />
              <p className="mt-1 text-sm font-semibold text-text">{top3[1].name}</p>
              <p className="mt-0.5 text-xs text-muted">{top3[1].pct}%</p>
              <p className="text-xs text-subtle">
                {top3[1].total}/{MAX_TOTAL}
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
                {top3[0].total}/{MAX_TOTAL}
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
                {top3[2].total}/{MAX_TOTAL}
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-36">
          <Select
            value={selClass}
            onChange={(e) => setSelClass(e.target.value)}
            options={toOptions(classes)}
            aria-label="Filter by class"
          />
        </div>
        <div className="w-48">
          <Select
            value={selExam}
            onChange={(e) => setSelExam(e.target.value)}
            options={toOptions(exams)}
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

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        // Top three carry a podium tint so placement reads at a glance.
        // Rank is list position, matching how the Rank column derives it.
        rowClassName={(s) =>
          ["bg-warning-soft", "bg-surface-hover", "bg-danger-soft"][filtered.indexOf(s)]
        }
        emptyTitle="No students found"
        emptyDescription="Try a different search term."
      />
    </div>
  );
}
