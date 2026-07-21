"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  Star,
  TrendingUp,
  Award,
  Target,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";

const staffPerformance = [
  { id: "ST001", name: "Mr. Rajesh Sharma",  role: "Principal",         dept: "Administration", q1: 92, q2: 94, q3: 96, rating: 4.8, trend: "up",   grade: "A+" },
  { id: "ST002", name: "Ms. Sunita Verma",   role: "Vice Principal",    dept: "Administration", q1: 88, q2: 90, q3: 91, rating: 4.6, trend: "up",   grade: "A"  },
  { id: "ST003", name: "Mr. Anil Kumar",     role: "Accountant",        dept: "Finance",        q1: 80, q2: 78, q3: 82, rating: 4.1, trend: "up",   grade: "B+" },
  { id: "ST004", name: "Ms. Pooja Mehta",    role: "HR Manager",        dept: "HR",             q1: 85, q2: 87, q3: 86, rating: 4.3, trend: "same", grade: "A"  },
  { id: "ST005", name: "Mr. Suresh Nair",    role: "IT Administrator",  dept: "IT",             q1: 90, q2: 88, q3: 85, rating: 4.4, trend: "down", grade: "A"  },
  { id: "ST006", name: "Ms. Kavita Joshi",   role: "Librarian",         dept: "Library",        q1: 75, q2: 76, q3: 78, rating: 3.9, trend: "up",   grade: "B"  },
  { id: "ST007", name: "Mr. Deepak Singh",   role: "Security Head",     dept: "Security",       q1: 82, q2: 80, q3: 79, rating: 4.0, trend: "down", grade: "B+" },
  { id: "ST008", name: "Mr. Vinod Tiwari",   role: "Canteen Manager",   dept: "Canteen",        q1: 70, q2: 72, q3: 74, rating: 3.7, trend: "up",   grade: "B"  },
];

const teacherPerformance = [
  { id: "T001", name: "Dr. Priya Sharma",   subject: "Mathematics",      classes: "10,11,12", q1: 95, q2: 96, q3: 97, rating: 4.9, trend: "up",   grade: "A+" },
  { id: "T002", name: "Mr. Rahul Verma",    subject: "Physics",          classes: "11,12",    q1: 88, q2: 90, q3: 92, rating: 4.6, trend: "up",   grade: "A"  },
  { id: "T003", name: "Ms. Anita Patel",    subject: "English",          classes: "6,7,8",    q1: 85, q2: 84, q3: 86, rating: 4.3, trend: "up",   grade: "A"  },
  { id: "T004", name: "Mr. Suresh Kumar",   subject: "History",          classes: "9,10",     q1: 78, q2: 76, q3: 75, rating: 3.8, trend: "down", grade: "B"  },
  { id: "T005", name: "Ms. Kavita Singh",   subject: "Chemistry",        classes: "11,12",    q1: 91, q2: 91, q3: 93, rating: 4.7, trend: "same", grade: "A+" },
  { id: "T006", name: "Mr. Amit Joshi",     subject: "Computer Science", classes: "8,9,10",   q1: 94, q2: 95, q3: 96, rating: 4.9, trend: "up",   grade: "A+" },
  { id: "T007", name: "Ms. Deepa Nair",     subject: "Biology",          classes: "11,12",    q1: 83, q2: 85, q3: 84, rating: 4.2, trend: "same", grade: "A"  },
  { id: "T008", name: "Mr. Vikram Gupta",   subject: "Phy. Education",   classes: "6-12",     q1: 80, q2: 82, q3: 83, rating: 4.1, trend: "up",   grade: "B+" },
];

type StaffPerf = (typeof staffPerformance)[number];
type TeacherPerf = (typeof teacherPerformance)[number];
type PerfRow = StaffPerf | TeacherPerf;

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const GRADE_META: Record<string, { variant: BadgeVariant; dot: string }> = {
  "A+": { variant: "success", dot: "bg-success" },
  A: { variant: "info", dot: "bg-info" },
  "B+": { variant: "warning", dot: "bg-warning" },
  B: { variant: "default", dot: "bg-subtle" },
  C: { variant: "danger", dot: "bg-danger" },
};

/** Departments and subjects both fall back to the neutral badge. */
const CATEGORY_VARIANT: Record<string, BadgeVariant> = {
  Administration: "info",
  Finance: "success",
  HR: "default",
  IT: "info",
  Library: "warning",
  Security: "danger",
  Canteen: "warning",
  Mathematics: "info",
  Physics: "default",
  English: "success",
  History: "warning",
  Chemistry: "default",
  "Computer Science": "info",
  Biology: "success",
  "Phy. Education": "danger",
};

const isStaffRow = (p: PerfRow): p is StaffPerf => "dept" in p;

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <ChevronUp className="size-4 text-success" />;
  if (trend === "down") return <ChevronDown className="size-4 text-danger" />;
  return <Minus className="size-4 text-subtle" />;
}

function trendClass(trend: string) {
  if (trend === "up") return "text-success";
  if (trend === "down") return "text-danger";
  return "text-subtle";
}

function scoreTone(score: number) {
  if (score >= 90) return { bar: "bg-success", text: "text-success" };
  if (score >= 80) return { bar: "bg-info", text: "text-info" };
  if (score >= 70) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-danger", text: "text-danger" };
}

function ScoreBar({ score }: { score: number }) {
  const tone = scoreTone(score);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-hover">
        {/* Width is genuinely data-driven — the only inline style on this page. */}
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${tone.text}`}>{score}</span>
    </div>
  );
}

const tabs = ["Staff", "Teachers"] as const;

export default function PerformancePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Staff");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");
  const { toast } = useToast();

  const data: PerfRow[] = tab === "Staff" ? staffPerformance : teacherPerformance;

  const filtered = data.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "All" || p.grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  const avgScore = Math.round(data.reduce((s, p) => s + p.q3, 0) / data.length);
  const topPerf = data.filter((p) => p.grade === "A+" || p.grade === "A").length;
  const improving = data.filter((p) => p.trend === "up").length;
  const avgRating = (data.reduce((s, p) => s + p.rating, 0) / data.length).toFixed(1);

  /**
   * The two tabs carry different identity columns (role/dept vs subject/classes),
   * so the column set is chosen to match whichever table is on screen.
   */
  const handleExport = () => {
    if (filtered.length === 0) {
      toast({
        title: "Nothing to export",
        description: `No ${tab.toLowerCase()} match the current filters.`,
        variant: "warning",
      });
      return;
    }
    const shared: { header: string; value: (p: PerfRow) => string | number }[] = [
      { header: "Q1 Score", value: (p) => p.q1 },
      { header: "Q2 Score", value: (p) => p.q2 },
      { header: "Q3 Score", value: (p) => p.q3 },
      { header: "Rating", value: (p) => p.rating },
      { header: "Trend", value: (p) => p.trend },
      { header: "Grade", value: (p) => p.grade },
    ];
    if (tab === "Staff") {
      exportToCsv<StaffPerf>(
        "staff-performance",
        [
          { header: "ID", value: (p) => p.id },
          { header: "Name", value: (p) => p.name },
          { header: "Role", value: (p) => p.role },
          { header: "Department", value: (p) => p.dept },
          ...shared,
        ],
        filtered as StaffPerf[]
      );
    } else {
      exportToCsv<TeacherPerf>(
        "teacher-performance",
        [
          { header: "ID", value: (p) => p.id },
          { header: "Name", value: (p) => p.name },
          { header: "Subject", value: (p) => p.subject },
          { header: "Classes", value: (p) => p.classes },
          ...shared,
        ],
        filtered as TeacherPerf[]
      );
    }
    toast({
      title: "Export ready",
      description: `${filtered.length} ${tab.toLowerCase()} performance record${filtered.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const columns: Column<PerfRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{p.name}</p>
            <p className="truncate text-xs text-subtle">
              {isStaffRow(p) ? p.role : `Class ${p.classes}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: tab === "Staff" ? "Department" : "Subject",
      sortable: true,
      sortValue: (p) => (isStaffRow(p) ? p.dept : p.subject),
      render: (p) => {
        const label = isStaffRow(p) ? p.dept : p.subject;
        return <Badge variant={CATEGORY_VARIANT[label] ?? "default"}>{label}</Badge>;
      },
    },
    { key: "q1", header: "Q1 Score", sortable: true, render: (p) => <ScoreBar score={p.q1} /> },
    { key: "q2", header: "Q2 Score", sortable: true, render: (p) => <ScoreBar score={p.q2} /> },
    { key: "q3", header: "Q3 Score", sortable: true, render: (p) => <ScoreBar score={p.q3} /> },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="inline-flex items-center gap-1 font-medium text-text">
          <Star className="size-3.5 fill-warning text-warning" />
          {p.rating}
        </span>
      ),
    },
    {
      key: "trend",
      header: "Trend",
      sortable: true,
      render: (p) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium capitalize ${trendClass(p.trend)}`}>
          <TrendIcon trend={p.trend} />
          {p.trend}
        </span>
      ),
    },
    {
      key: "grade",
      header: "Grade",
      sortable: true,
      render: (p) => (
        <Badge variant={GRADE_META[p.grade]?.variant ?? "default"} className="font-semibold">
          {p.grade}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Performance"
        description="Track and evaluate staff & teacher performance"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export Report
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Avg Score" value={avgScore} suffix="%" icon={Target} tone="indigo" />
        <StatCard label="Top Performers" value={topPerf} icon={Award} tone="emerald" />
        <StatCard label="Improving" value={improving} icon={TrendingUp} tone="cyan" />
        <StatCard label="Avg Rating" value={avgRating} icon={Star} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Performance views"
          className="inline-flex gap-1 rounded-md bg-surface-sunken p-1"
        >
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setSearch("");
                setGradeFilter("All");
              }}
              className={`focus-ring rounded-sm px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t ? "bg-surface-raised text-text shadow-sm" : "text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search performance records"
          />
        </div>

        <div className="w-40">
          <Select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            options={[
              { label: "All Grades", value: "All" },
              ...["A+", "A", "B+", "B", "C"].map((g) => ({ label: g, value: g })),
            ]}
            aria-label="Filter by grade"
          />
        </div>

        <p className="ml-auto text-xs text-subtle">{filtered.length} records</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(p) => p.id}
        emptyTitle="No records found"
        emptyDescription="Try adjusting your filters"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <p>
          Showing <strong className="font-semibold text-text">{filtered.length}</strong> of{" "}
          <strong className="font-semibold text-text">{data.length}</strong> records
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {["A+", "A", "B+", "B"].map((g) => {
            const count = filtered.filter((p) => p.grade === g).length;
            return (
              <span key={g} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${GRADE_META[g].dot}`} />
                {g}: <strong className="font-semibold text-text">{count}</strong>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
