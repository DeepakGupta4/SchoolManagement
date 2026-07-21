"use client";

import React, { useMemo, useState } from "react";
import {
  Plus, Search, Download, Eye, Edit, Trash2, Calendar, Clock, Users,
  Paperclip, CheckCircle, AlertCircle, XCircle, BookOpen, X,
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
import { assignmentsApi, type Assignment } from "@/lib/api/assignments";
import type { AssignmentSchema } from "@/lib/schemas/assignment";
import { AssignmentFormModal } from "./AssignmentFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const statusConfig: Record<
  string,
  { variant: BadgeVariant; icon: React.ElementType; label: string }
> = {
  active:    { variant: "info",    icon: Clock,       label: "Active"    },
  completed: { variant: "success", icon: CheckCircle, label: "Completed" },
  upcoming:  { variant: "warning", icon: AlertCircle, label: "Upcoming"  },
  overdue:   { variant: "danger",  icon: XCircle,     label: "Overdue"   },
};

const fallbackStatus = {
  variant: "default" as BadgeVariant,
  icon: AlertCircle as React.ElementType,
  label: "Unknown",
};

/** Assignment types share the semantic palette rather than bespoke hex. */
const typeTone: Record<string, string> = {
  Worksheet: "bg-info-soft text-info-text",
  "Problem Set": "bg-primary-soft text-primary-text",
  Essay: "bg-warning-soft text-warning-text",
  Research: "bg-info-soft text-info-text",
  Diagram: "bg-success-soft text-success-text",
  Practical: "bg-danger-soft text-danger-text",
};

const subjectDot: Record<string, string> = {
  Mathematics: "bg-primary",
  Physics: "bg-info",
  English: "bg-warning",
  Chemistry: "bg-success",
  History: "bg-warning",
  Biology: "bg-success",
  "Comp. Sci": "bg-info",
};

const tabs = ["All", "Active", "Upcoming", "Completed"];

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch]       = useState("");
  // Held by id, not by value, so the detail panel always reflects the freshest
  // row and closes by itself when that row is deleted.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const filters = useMemo(
    () => ({ search, status: activeTab === "All" ? "All" : activeTab.toLowerCase() }),
    [search, activeTab]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    assignmentsApi,
    filters,
    { label: "assignment", describe: (a) => a.title }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Assignment | null>(null);

  const selected = items.find((a) => a.id === selectedId) ?? null;

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((a) => a.status === "active").length,
      completed: items.filter((a) => a.status === "completed").length,
      upcoming: items.filter((a) => a.status === "upcoming").length,
    }),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: AssignmentSchema) => {
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

  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No assignments match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Assignment>(
      "assignments",
      [
        { header: "Code", value: (a) => a.code },
        { header: "Title", value: (a) => a.title },
        { header: "Type", value: (a) => a.type },
        { header: "Subject", value: (a) => a.subject },
        { header: "Class", value: (a) => a.class },
        { header: "Teacher", value: (a) => a.teacher },
        { header: "Given", value: (a) => a.given },
        { header: "Due", value: (a) => a.due },
        { header: "Total Marks", value: (a) => a.totalMarks },
        { header: "Submitted", value: (a) => a.submitted },
        { header: "Class Size", value: (a) => a.total },
        { header: "Status", value: (a) => statusConfig[a.status]?.label ?? a.status },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} assignment${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const columns: Column<Assignment>[] = [
    {
      key: "title",
      header: "Assignment",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md",
              typeTone[a.type] ?? "bg-surface-hover text-muted"
            )}
          >
            <BookOpen className="size-4" />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-medium",
                selectedId === a.id ? "text-primary" : "text-text"
              )}
            >
              {a.title}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Badge className={cn("text-[10px]", typeTone[a.type] ?? "bg-surface-hover text-muted")}>
                {a.type}
              </Badge>
              <span className="truncate text-xs text-subtle">{a.teacher}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (a) => (
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-text">
          <span className={cn("size-2 rounded-full", subjectDot[a.subject] ?? "bg-border-strong")} />
          {a.subject}
        </span>
      ),
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (a) => <Badge variant="info">{a.class}</Badge>,
    },
    {
      key: "due",
      header: "Due Date",
      sortable: true,
      render: (a) => (
        <div>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-text">
            <Calendar className="size-3.5 text-subtle" />
            {a.due}
          </span>
          <span className="mt-0.5 block whitespace-nowrap text-[11px] text-subtle">
            Given: {a.given}
          </span>
        </div>
      ),
    },
    {
      key: "submitted",
      header: "Submission",
      sortable: true,
      sortValue: (a) => (a.total ? a.submitted / a.total : 0),
      render: (a) => {
        const subPct = a.total ? Math.round((a.submitted / a.total) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-hover">
              <div
                className={cn(
                  "h-full rounded-full",
                  subPct === 100 ? "bg-success" : subPct >= 50 ? "bg-primary" : "bg-warning"
                )}
                style={{ width: `${subPct}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-xs font-medium text-muted">
              {a.submitted}/{a.total}
            </span>
          </div>
        );
      },
    },
    {
      key: "totalMarks",
      header: "Marks",
      sortable: true,
      align: "right",
      render: (a) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {a.totalMarks}
          <span className="ml-0.5 text-xs font-normal text-subtle">pts</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (a) => {
        const sc = statusConfig[a.status] ?? fallbackStatus;
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1.5 px-2.5 py-1">
            <StatusIcon className="size-3" />
            {sc.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      // The row itself toggles the detail panel, so the action cluster stops the
      // click from bubbling — each button owns its own behaviour.
      render: (a) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
            aria-label={`View ${a.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-info-soft hover:text-info-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditing(a);
              setFormOpen(true);
            }}
            aria-label={`Edit ${a.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-success-soft hover:text-success-text"
          >
            <Edit className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(a)}
            aria-label={`Delete ${a.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger-text"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const detailRows = selected
    ? [
        { label: "Teacher", value: selected.teacher, icon: Users },
        { label: "Given On", value: selected.given, icon: Calendar },
        { label: "Due Date", value: selected.due, icon: Clock },
        { label: "Total Marks", value: `${selected.totalMarks} pts`, icon: CheckCircle },
        { label: "Type", value: selected.type, icon: Paperclip },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Assignments"
        description="Manage and track all class assignments"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New Assignment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={BookOpen} tone="indigo" />
        <StatCard label="Active" value={stats.active} icon={Clock} tone="cyan" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle} tone="emerald" />
        <StatCard label="Upcoming" value={stats.upcoming} icon={AlertCircle} tone="amber" />
      </div>

      <div className={cn("grid grid-cols-1 gap-5", selected && "xl:grid-cols-[1fr_380px]")}>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? "primary" : "ghost"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ))}
            </div>
            <div className="w-full max-w-70 flex-1">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignments…"
                icon={<Search className="size-4" />}
                aria-label="Search assignments"
              />
            </div>
            <p className="ml-auto text-xs text-muted">{items.length} assignments</p>
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
              rows={items}
              rowKey={(a) => a.id}
              loading={loading}
              onRowClick={(a) => setSelectedId(selectedId === a.id ? null : a.id)}
              rowClassName={(a) => (selectedId === a.id ? "bg-primary-soft" : undefined)}
              emptyTitle="No assignments found"
              emptyDescription={
                search || activeTab !== "All"
                  ? "Try a different tab or clear your search."
                  : "Create your first assignment to get started."
              }
              emptyAction={
                search || activeTab !== "All" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setActiveTab("All");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="outline" onClick={openCreate}>
                    <Plus className="size-4" />
                    New assignment
                  </Button>
                )
              }
            />
          )}
        </div>

        {selected && (
          <Card className="h-fit overflow-hidden border-primary">
            <div className="gradient-indigo p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
                  <BookOpen className="size-5" />
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Close details"
                  className="focus-ring rounded-sm bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-base font-semibold leading-snug text-white">
                {selected.title}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {selected.subject} · Class {selected.class}
              </p>
            </div>

            <CardContent className="flex flex-col gap-3.5">
              {detailRows.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
                    <d.icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      {d.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-text">{d.value}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-md bg-surface-sunken p-3.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-text">Submission Progress</p>
                  <p className="text-sm font-semibold text-primary">
                    {selected.submitted}/{selected.total}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${
                        selected.total
                          ? Math.round((selected.submitted / selected.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                  {selected.total - selected.submitted} students yet to submit
                </p>
              </div>

              <Button className="w-full">View Submissions</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AssignmentFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete assignment?"
        description={
          pendingDelete
            ? `${pendingDelete.title} and its ${pendingDelete.submitted} submission(s) will be permanently removed. This cannot be undone.`
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
