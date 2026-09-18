"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Download, Star, TrendingUp, Users, Target } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  TableSkeleton,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { listTeachers } from "@/lib/api/teachers";
import { type Teacher, teacherName } from "@/types/teacher";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

/** Departments fall back to the neutral badge when unmapped. */
const DEPARTMENT_VARIANT: Record<string, BadgeVariant> = {
  Science: "info",
  Mathematics: "info",
  Languages: "success",
  "Social Studies": "warning",
  "Computer Science": "info",
  Sports: "danger",
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: "success",
  "on-leave": "warning",
  inactive: "default",
  resigned: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  "on-leave": "On Leave",
  inactive: "Inactive",
  resigned: "Resigned",
};

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
      <span className={`text-xs font-semibold ${tone.text}`}>{score}%</span>
    </div>
  );
}

export default function PerformancePage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    listTeachers()
      .then((data) => {
        if (!cancelled) setTeachers(data);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Could not load teachers", variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const departments = useMemo(
    () => ["All", ...Array.from(new Set(teachers.map((t) => t.department))).sort()],
    [teachers]
  );

  const filtered = teachers.filter((t) => {
    const name = teacherName(t).toLowerCase();
    const matchSearch =
      name.includes(search.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || t.department === deptFilter;
    return matchSearch && matchDept;
  });

  const totalTeachers = teachers.length;
  const activeCount = teachers.filter((t) => t.status === "active").length;
  const avgAttendance = totalTeachers
    ? Math.round(teachers.reduce((s, t) => s + t.attendancePercent, 0) / totalTeachers)
    : 0;
  const avgRating = totalTeachers
    ? (teachers.reduce((s, t) => s + t.rating, 0) / totalTeachers).toFixed(1)
    : "0.0";

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No teachers match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Teacher>(
      "teacher-performance",
      [
        { header: "Employee ID", value: (t) => t.employeeId },
        { header: "Name", value: (t) => teacherName(t) },
        { header: "Department", value: (t) => t.department },
        { header: "Subjects", value: (t) => t.subjects.join(", ") },
        { header: "Experience (yrs)", value: (t) => t.experienceYears },
        { header: "Attendance (%)", value: (t) => t.attendancePercent },
        { header: "Rating", value: (t) => t.rating },
        { header: "Status", value: (t) => STATUS_LABEL[t.status] ?? t.status },
      ],
      filtered
    );
    toast({
      title: "Export ready",
      description: `${filtered.length} teacher performance record${filtered.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const columns: Column<Teacher>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (t) => teacherName(t),
      render: (t) => (
        <div className="flex items-center gap-3">
          <Avatar name={teacherName(t)} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{teacherName(t)}</p>
            <p className="truncate text-xs text-subtle">{t.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      render: (t) => (
        <Badge variant={DEPARTMENT_VARIANT[t.department] ?? "default"}>{t.department}</Badge>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      render: (t) => (
        <span className="text-sm text-muted">{t.subjects.join(", ") || "—"}</span>
      ),
    },
    {
      key: "experienceYears",
      header: "Experience",
      sortable: true,
      align: "right",
      render: (t) => <span className="text-muted">{t.experienceYears} yrs</span>,
    },
    {
      key: "attendancePercent",
      header: "Attendance",
      sortable: true,
      render: (t) => <ScoreBar score={t.attendancePercent} />,
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      align: "right",
      render: (t) => (
        <span className="inline-flex items-center gap-1 font-medium text-text">
          <Star className="size-3.5 fill-warning text-warning" />
          {t.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t) => (
        <Badge variant={STATUS_VARIANT[t.status] ?? "default"}>
          {STATUS_LABEL[t.status] ?? t.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Performance"
        description="Track and evaluate teacher performance"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export Report
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Teachers" value={totalTeachers} icon={Users} tone="indigo" />
        <StatCard label="Active" value={activeCount} icon={TrendingUp} tone="emerald" />
        <StatCard label="Avg Attendance" value={avgAttendance} suffix="%" icon={Target} tone="cyan" />
        <StatCard label="Avg Rating" value={avgRating} icon={Star} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search teacher records"
          />
        </div>

        <div className="w-52">
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={departments.map((d) => ({
              label: d === "All" ? "All Departments" : d,
              value: d,
            }))}
            aria-label="Filter by department"
          />
        </div>

        <p className="ml-auto text-xs text-subtle">{filtered.length} records</p>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : (
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          emptyTitle="No teachers found"
          emptyDescription={
            teachers.length === 0
              ? "Add teachers to see performance metrics."
              : "Try adjusting your filters."
          }
        />
      )}

      {!loading && teachers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <p>
            Showing <strong className="font-semibold text-text">{filtered.length}</strong> of{" "}
            <strong className="font-semibold text-text">{teachers.length}</strong> teachers
          </p>
        </div>
      )}
    </div>
  );
}
