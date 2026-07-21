"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  PageHeader,
  Pagination,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import { examsApi, type Exam } from "@/lib/api/exams";
import type { ExamSchema } from "@/lib/schemas/exam";
import { ExamFormModal } from "./ExamFormModal";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const PAGE_SIZE = 6;

const statusConfig: Record<string, { variant: BadgeVariant; icon: LucideIcon; label: string }> = {
  upcoming: { variant: "info", icon: Clock, label: "Upcoming" },
  ongoing: { variant: "warning", icon: AlertCircle, label: "Ongoing" },
  completed: { variant: "success", icon: CheckCircle, label: "Completed" },
  cancelled: { variant: "danger", icon: XCircle, label: "Cancelled" },
};

const fallbackStatus = { variant: "default" as BadgeVariant, icon: Clock, label: "Unknown" };

/** Per exam-type presentation: badge tone, icon-tile gradient, timeline dot colour. */
const typeConfig: Record<string, { variant: BadgeVariant; gradient: string; dot: string }> = {
  "Unit Test": { variant: "info", gradient: "gradient-cyan", dot: "bg-info" },
  "Mid-Term": { variant: "default", gradient: "gradient-violet", dot: "bg-primary" },
  Final: { variant: "danger", gradient: "gradient-rose", dot: "bg-danger" },
  Practical: { variant: "success", gradient: "gradient-emerald", dot: "bg-success" },
  "Class Test": { variant: "warning", gradient: "gradient-amber", dot: "bg-warning" },
};

const fallbackType = { variant: "default" as BadgeVariant, gradient: "gradient-indigo", dot: "bg-border-strong" };

const tabs = ["All", "Upcoming", "Ongoing", "Completed"];

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // The status tab is deliberately left out of the server filters: the stat
  // cards need per-status counts across the whole (otherwise filtered) set, so
  // the status narrowing is applied during render instead.
  const filters = useMemo(() => ({ search, status: "All" }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    examsApi,
    filters,
    { label: "exam", describe: (e) => e.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Exam | null>(null);
  const { toast } = useToast();

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Rows for the table only — stat cards keep counting the full `items`.
  const visible = useMemo(
    () =>
      activeTab === "All"
        ? items
        : items.filter((e) => e.status === activeTab.toLowerCase()),
    [items, activeTab]
  );

  // A delete can empty the current page, so clamp during render rather than
  // correcting it in an effect.
  const lastPage = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, lastPage);

  const paged = useMemo(
    () => visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [visible, safePage]
  );

  /** Exports every row the active tab and search leave visible, across pages. */
  const handleExport = () => {
    if (visible.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No exams match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Exam>(
      "exams",
      [
        { header: "Code", value: (e) => e.code },
        { header: "Exam", value: (e) => e.name },
        { header: "Type", value: (e) => e.type },
        { header: "Subject", value: (e) => e.subject },
        { header: "Classes", value: (e) => e.classes.join(" / ") },
        { header: "Date", value: (e) => e.date },
        { header: "Time", value: (e) => e.time },
        { header: "Duration", value: (e) => e.duration },
        { header: "Total Marks", value: (e) => e.totalMarks },
        { header: "Students", value: (e) => e.students },
        { header: "Status", value: (e) => e.status },
      ],
      visible
    );
    toast({
      title: "Export ready",
      description: `${visible.length} exam${visible.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const counts = useMemo(
    () => ({
      total: items.length,
      upcoming: items.filter((e) => e.status === "upcoming").length,
      ongoing: items.filter((e) => e.status === "ongoing").length,
      completed: items.filter((e) => e.status === "completed").length,
    }),
    [items]
  );

  const upcomingExams = useMemo(() => items.filter((e) => e.status === "upcoming"), [items]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ExamSchema) => {
    const ok = await save(values, editing);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
  };

  const columns: Column<Exam>[] = [
    {
      key: "name",
      header: "Exam",
      sortable: true,
      render: (exam) => {
        const tc = typeConfig[exam.type] ?? fallbackType;
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md text-white",
                tc.gradient
              )}
            >
              <FileText className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{exam.name}</p>
              <p className="truncate text-xs text-subtle">{exam.code}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (exam) => (
        <Badge variant={(typeConfig[exam.type] ?? fallbackType).variant}>{exam.type}</Badge>
      ),
    },
    {
      key: "classes",
      header: "Class",
      render: (exam) => (
        <div className="flex flex-wrap gap-1">
          {exam.classes.map((c) => (
            <Badge key={c} variant="info">
              {c}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (exam) => <span className="whitespace-nowrap text-text">{exam.subject}</span>,
    },
    {
      key: "date",
      header: "Date & Time",
      render: (exam) => (
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
            <Calendar className="size-3 text-subtle" />
            {exam.date}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-subtle">
            <Clock className="size-3" />
            {exam.time}
          </p>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (exam) => <span className="whitespace-nowrap text-muted">{exam.duration}</span>,
    },
    {
      key: "totalMarks",
      header: "Marks",
      sortable: true,
      align: "right",
      render: (exam) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {exam.totalMarks}
          <span className="ml-0.5 text-xs font-normal text-subtle">pts</span>
        </span>
      ),
    },
    {
      key: "students",
      header: "Students",
      sortable: true,
      align: "right",
      render: (exam) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
          <Users className="size-3.5 text-subtle" />
          {exam.students.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (exam) => {
        const sc = statusConfig[exam.status] ?? fallbackStatus;
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1">
            <StatusIcon className="size-3" />
            {sc.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (exam) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(exam);
              setFormOpen(true);
            }}
            aria-label={`Edit ${exam.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(exam)}
            aria-label={`Delete ${exam.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Examinations"
        description="Schedule, manage and track all exams"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Schedule Exam
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Exams" value={counts.total} icon={FileText} tone="indigo" />
        <StatCard label="Upcoming" value={counts.upcoming} icon={CalendarClock} tone="cyan" />
        <StatCard label="Ongoing" value={counts.ongoing} icon={Clock} tone="amber" />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              aria-pressed={activeTab === tab}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-w-60 max-w-xs flex-1">
          <Input
            type="search"
            placeholder="Search exams…"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search exams"
          />
        </div>

        <p className="ml-auto text-xs text-muted">{visible.length} exams</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Table
            columns={columns}
            rows={paged}
            rowKey={(e) => e.id}
            loading={loading}
            emptyTitle="No exams found"
            emptyDescription={
              search || activeTab !== "All"
                ? "Try adjusting your filters"
                : "Schedule your first exam to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                Schedule Exam
              </Button>
            }
          />

          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={visible.length}
            onPageChange={setPage}
          />
        </>
      )}

      <Card>
        <CardHeader>
          <div>
            <p className="text-sm font-semibold text-text">Upcoming Exam Timeline</p>
            <p className="mt-0.5 text-xs text-muted">Next 3 months schedule</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col">
          {upcomingExams.length === 0 ? (
            <p className="py-2 text-sm text-muted">No upcoming exams.</p>
          ) : (
            upcomingExams.map((exam, i, arr) => {
              const tc = typeConfig[exam.type] ?? fallbackType;
              const isLast = i === arr.length - 1;
              return (
                <div key={exam.id} className={cn("flex gap-4", !isLast && "pb-5")}>
                  <div className="flex shrink-0 flex-col items-center">
                    <span className={cn("mt-1.5 size-3 rounded-full", tc.dot)} />
                    {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text">
                        {exam.name} — {exam.subject}
                      </p>
                      <Badge variant={tc.variant}>{exam.type}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3 text-subtle" />
                        {exam.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3 text-subtle" />
                        {exam.time} · {exam.duration}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3 text-subtle" />
                        {exam.students.toLocaleString()} students
                      </span>
                      <span>
                        Class:{" "}
                        <strong className="font-semibold text-text">
                          {exam.classes.join(", ")}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <ExamFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete exam?"
        description={
          pendingDelete
            ? `${pendingDelete.name} (${pendingDelete.code}) will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
