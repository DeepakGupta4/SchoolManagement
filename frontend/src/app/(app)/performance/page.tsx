"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, Target, TrendingUp, Users, Building2 } from "lucide-react";
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
  TableSkeleton,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { fetchAllTeachers } from "@/lib/api/teachers";
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

export default function PerformancePage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    // Complete roster (all pages) so the tiles and export reflect the whole school.
    fetchAllTeachers()
      .then((data) => {
        if (cancelled) return;
        setError(false);
        setTeachers(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast({ title: "Could not load teachers", variant: "error" });
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
  const avgExperience = totalTeachers
    ? (teachers.reduce((s, t) => s + t.experienceYears, 0) / totalTeachers).toFixed(1)
    : "0";
  const deptCount = new Set(teachers.map((t) => t.department)).size;

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
      "teacher-overview",
      [
        { header: "Employee ID", value: (t) => t.employeeId },
        { header: "Name", value: (t) => teacherName(t) },
        { header: "Department", value: (t) => t.department },
        { header: "Subjects", value: (t) => t.subjects.join(", ") },
        { header: "Classes", value: (t) => t.classes.join(", ") },
        { header: "Experience (yrs)", value: (t) => t.experienceYears },
        { header: "Status", value: (t) => STATUS_LABEL[t.status] ?? t.status },
      ],
      filtered
    );
    toast({
      title: "Export ready",
      description: `${filtered.length} teacher record${filtered.length === 1 ? "" : "s"} exported to CSV.`,
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
      render: (t) => <span className="text-sm text-muted">{t.subjects.join(", ") || "—"}</span>,
    },
    {
      key: "classes",
      header: "Classes",
      render: (t) => <span className="text-sm text-muted">{t.classes.join(", ") || "—"}</span>,
    },
    {
      key: "experienceYears",
      header: "Experience",
      sortable: true,
      align: "right",
      render: (t) => <span className="text-muted">{t.experienceYears} yrs</span>,
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
        description="Teacher roster — department, subjects, teaching load and experience at a glance"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export Report
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Teachers" value={error ? "—" : totalTeachers} icon={Users} tone="indigo" />
        <StatCard label="Active" value={error ? "—" : activeCount} icon={TrendingUp} tone="emerald" />
        <StatCard label="Avg Experience" value={error ? "—" : avgExperience} suffix=" yrs" icon={Target} tone="cyan" />
        <StatCard label="Departments" value={error ? "—" : deptCount} icon={Building2} tone="amber" />
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
        <TableSkeleton rows={6} columns={6} />
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger">Could not load teachers.</p>
            <p className="text-xs text-muted">Check that the API server is running, then reload this page.</p>
          </CardContent>
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          emptyTitle="No teachers found"
          emptyDescription={
            teachers.length === 0
              ? "Add teachers to see the overview."
              : "Try adjusting your filters."
          }
        />
      )}

      {!loading && !error && teachers.length > 0 && (
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
