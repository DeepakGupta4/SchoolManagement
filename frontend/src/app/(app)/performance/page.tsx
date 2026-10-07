"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, Star, TrendingUp, Users, Target, Pencil } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  Table,
  TableSkeleton,
  Textarea,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { fetchAllTeachers, reviewTeacher } from "@/lib/api/teachers";
import { cn } from "@/lib/utils";
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

/** Read-only 5-star display for a rating (rounded). */
function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-3.5", n <= filled ? "fill-warning text-warning" : "text-subtle")} />
      ))}
    </span>
  );
}

export default function PerformancePage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { toast } = useToast();

  // Review modal state.
  const [reviewing, setReviewing] = useState<Teacher | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewNote, setReviewNote] = useState("");
  const [savingReview, setSavingReview] = useState(false);

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
  // Average over teachers who've actually been reviewed (unreviewed 0s don't drag it down).
  const reviewed = teachers.filter((t) => t.reviewedAt);
  const avgRating = reviewed.length
    ? (reviewed.reduce((s, t) => s + t.rating, 0) / reviewed.length).toFixed(1)
    : "—";

  const openReview = (t: Teacher) => {
    setReviewing(t);
    setReviewRating(t.rating || 0);
    setReviewNote(t.reviewNote || "");
  };

  const saveReview = async () => {
    if (!reviewing) return;
    try {
      setSavingReview(true);
      const r = await reviewTeacher(reviewing.id, { rating: reviewRating, note: reviewNote });
      setTeachers((prev) =>
        prev.map((x) =>
          x.id === reviewing.id
            ? { ...x, rating: r.rating, reviewNote: r.reviewNote, reviewedAt: r.reviewedAt, reviewedBy: r.reviewedBy }
            : x
        )
      );
      toast({ title: "Review saved", description: `${teacherName(reviewing)} rated ${r.rating}/5.`, variant: "success" });
      setReviewing(null);
    } catch (e) {
      toast({ title: "Could not save review", description: e instanceof Error ? e.message : "Try again.", variant: "error" });
    } finally {
      setSavingReview(false);
    }
  };

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
        { header: "Classes", value: (t) => t.classes.join(", ") },
        { header: "Experience (yrs)", value: (t) => t.experienceYears },
        { header: "Rating", value: (t) => (t.reviewedAt ? t.rating : "") },
        { header: "Reviewed On", value: (t) => t.reviewedAt ?? "" },
        { header: "Review Note", value: (t) => t.reviewNote ?? "" },
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
      key: "experienceYears",
      header: "Experience",
      sortable: true,
      align: "right",
      render: (t) => <span className="text-muted">{t.experienceYears} yrs</span>,
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      sortValue: (t) => (t.reviewedAt ? t.rating : -1),
      render: (t) =>
        t.reviewedAt ? (
          <div className="flex items-center gap-2">
            <Stars value={t.rating} />
            <span className="text-xs font-medium text-text">{t.rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-xs text-subtle">Not reviewed</span>
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
    {
      key: "actions",
      header: "",
      align: "right",
      render: (t) => (
        <Button size="sm" variant="outline" onClick={() => openReview(t)}>
          <Pencil className="size-3.5" />
          {t.reviewedAt ? "Re-review" : "Review"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Performance"
        description="Rate and review teacher performance — with department, subjects and experience at a glance."
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
        <StatCard label="Avg Rating" value={error ? "—" : avgRating} icon={Star} tone="amber" sub={`${reviewed.length} reviewed`} />
        <StatCard label="Avg Experience" value={error ? "—" : avgExperience} suffix=" yrs" icon={Target} tone="cyan" />
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

      <Modal
        open={!!reviewing}
        onOpenChange={(o) => !o && setReviewing(null)}
        title={reviewing ? `Review ${teacherName(reviewing)}` : "Review"}
        description="Set a performance rating and an optional note. Saved against the teacher."
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewing(null)} disabled={savingReview}>
              Cancel
            </Button>
            <Button onClick={saveReview} disabled={savingReview || reviewRating < 1}>
              {savingReview ? "Saving…" : "Save review"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={n <= reviewRating}
                  className="focus-ring rounded p-0.5"
                >
                  <Star className={cn("size-6", n <= reviewRating ? "fill-warning text-warning" : "text-subtle")} />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted">{reviewRating ? `${reviewRating}/5` : "Not rated"}</span>
            </div>
          </div>
          <Textarea
            label="Review note"
            rows={4}
            placeholder="Strengths, areas to improve, goals for next term…"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
          {reviewing?.reviewedAt && (
            <p className="text-xs text-subtle">
              Last reviewed {reviewing.reviewedAt}
              {reviewing.reviewedBy ? ` by ${reviewing.reviewedBy}` : ""}.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
