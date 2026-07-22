"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  Clock,
  Download,
  Pencil,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import { examScheduleApi, type ScheduledExam } from "@/lib/api/examSchedule";
import type { ScheduledExamSchema } from "@/lib/schemas/examSchedule";
import { ScheduledExamFormModal } from "./ScheduledExamFormModal";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const statusVariant: Record<string, BadgeVariant> = {
  upcoming: "info",
  ongoing: "warning",
  completed: "success",
};

const tabs = ["All", "Upcoming", "Ongoing", "Completed"];

export default function ExamSchedulePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // The status tab is deliberately left out of the server filters: the stat
  // cards need per-status counts across the whole (otherwise filtered) set, so
  // the status narrowing is applied during render instead.
  const filters = useMemo(() => ({ search, status: "All" }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    examScheduleApi,
    filters,
    { label: "scheduled exam", describe: (e) => `${e.exam} — ${e.subject}` }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledExam | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ScheduledExam | null>(null);
  const { toast } = useToast();

  // Rows for the table only — stat cards keep counting the full `items`.
  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((e) => e.status === filter.toLowerCase())),
    [items, filter]
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      upcoming: items.filter((e) => e.status === "upcoming").length,
      ongoing: items.filter((e) => e.status === "ongoing").length,
      completed: items.filter((e) => e.status === "completed").length,
    }),
    [items]
  );

  const handleExport = () => {
    if (visible.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No scheduled exams match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<ScheduledExam>(
      "exam-schedule",
      [
        { header: "Code", value: (e) => e.code },
        { header: "Exam", value: (e) => e.exam },
        { header: "Subject", value: (e) => e.subject },
        { header: "Class", value: (e) => e.class },
        { header: "Date", value: (e) => e.date },
        { header: "Time", value: (e) => e.time },
        { header: "Duration", value: (e) => e.duration },
        { header: "Room", value: (e) => e.room },
        { header: "Invigilator", value: (e) => e.invigilator },
        { header: "Total Marks", value: (e) => e.totalMarks },
        { header: "Status", value: (e) => e.status },
      ],
      visible
    );
    toast({
      title: "Export ready",
      description: `${visible.length} scheduled exam${visible.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ScheduledExamSchema) => {
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

  const columns: Column<ScheduledExam>[] = [
    {
      key: "exam",
      header: "Exam",
      sortable: true,
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{e.exam}</p>
          <p className="truncate text-xs text-subtle">{e.code}</p>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap text-text">{e.subject}</span>,
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (e) => <Badge variant="info">{e.class}</Badge>,
    },
    {
      key: "date",
      header: "Date",
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
          <Calendar className="size-3 text-subtle" />
          {e.date}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
          <Clock className="size-3 text-subtle" />
          {e.time}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (e) => <span className="whitespace-nowrap text-muted">{e.duration}</span>,
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap text-muted">{e.room}</span>,
    },
    {
      key: "invigilator",
      header: "Invigilator",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap text-text">{e.invigilator}</span>,
    },
    {
      key: "totalMarks",
      header: "Marks",
      sortable: true,
      align: "right",
      render: (e) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {e.totalMarks}
          <span className="ml-0.5 text-xs font-normal text-subtle">pts</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (e) => (
        <Badge variant={statusVariant[e.status] ?? "default"} className="capitalize">
          {e.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(e);
              setFormOpen(true);
            }}
            aria-label={`Edit ${e.exam} — ${e.subject}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(e)}
            aria-label={`Delete ${e.exam} — ${e.subject}`}
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
        title="Exam Schedule"
        description="View and manage all scheduled examinations"
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
        <StatCard label="Total Scheduled" value={counts.total} icon={CalendarCheck} tone="indigo" />
        <StatCard label="Upcoming" value={counts.upcoming} icon={CalendarClock} tone="cyan" />
        <StatCard label="Ongoing" value={counts.ongoing} icon={PencilLine} tone="amber" />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              aria-pressed={filter === tab}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === tab
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
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search scheduled exams"
          />
        </div>
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
        <Table
          columns={columns}
          rows={visible}
          rowKey={(e) => e.id}
          loading={loading}
          emptyTitle="No scheduled exams found"
          emptyDescription={
            search || filter !== "All"
              ? "Try adjusting your filters"
              : "Add your first schedule entry to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Schedule Exam
            </Button>
          }
        />
      )}

      <ScheduledExamFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete scheduled exam?"
        description={
          pendingDelete
            ? `${pendingDelete.exam} — ${pendingDelete.subject} (${pendingDelete.class}) will be permanently removed. This cannot be undone.`
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
