"use client";

import React, { useMemo, useState } from "react";
import {
  Award,
  CheckCircle,
  Clock,
  Download,
  GraduationCap,
  HeartHandshake,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
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
import { scholarshipsApi, type Scholarship } from "@/lib/api/scholarships";
import type { ScholarshipSchema } from "@/lib/schemas/scholarship";
import { ScholarshipFormModal } from "./ScholarshipFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const typeStyles: Record<string, { variant: BadgeVariant; tile: string; bar: string }> = {
  Merit: { variant: "info", tile: "bg-info-soft text-info-text", bar: "bg-info" },
  "Need-Based": { variant: "success", tile: "bg-success-soft text-success-text", bar: "bg-success" },
  Sports: { variant: "warning", tile: "bg-warning-soft text-warning-text", bar: "bg-warning" },
  Cultural: { variant: "default", tile: "bg-primary-soft text-primary-text", bar: "bg-primary" },
};

const fallbackType = {
  variant: "default" as BadgeVariant,
  tile: "bg-surface-hover text-muted",
  bar: "bg-primary",
};

const statusConfig: Record<
  string,
  { variant: BadgeVariant; icon: React.ElementType; label: string }
> = {
  active: { variant: "success", icon: CheckCircle, label: "Active" },
  pending: { variant: "warning", icon: Clock, label: "Pending" },
  expired: { variant: "default", icon: XCircle, label: "Expired" },
};

const fallbackStatus = { variant: "default" as BadgeVariant, icon: XCircle, label: "Unknown" };

const tabs = ["All", "Active", "Pending", "Expired"];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ScholarshipsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // The status tab is deliberately left out of the server filters: the stat
  // cards and type breakdown need per-status counts across the whole (otherwise
  // filtered) set, so the status narrowing is applied during render instead.
  const filters = useMemo(() => ({ search, status: "All" }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    scholarshipsApi,
    filters,
    { label: "scholarship", describe: (s) => `${s.student} (${s.code})` }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Scholarship | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Scholarship | null>(null);
  const { toast } = useToast();

  // Rows for the table only — stat cards keep counting the full `items`.
  const visible = useMemo(
    () =>
      activeTab === "All" ? items : items.filter((s) => s.status === activeTab.toLowerCase()),
    [items, activeTab]
  );

  const handleExport = () => {
    if (visible.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No scholarships match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Scholarship>(
      "scholarships",
      [
        { header: "Code", value: (s) => s.code },
        { header: "Student", value: (s) => s.student },
        { header: "Class", value: (s) => s.class },
        { header: "Type", value: (s) => s.type },
        { header: "Percentage", value: (s) => s.percentage },
        { header: "Amount (INR)", value: (s) => s.amount },
        { header: "Reason", value: (s) => s.reason },
        { header: "Status", value: (s) => s.status },
        { header: "Since", value: (s) => s.since },
      ],
      visible
    );
    toast({
      title: "Export ready",
      description: `${visible.length} scholarship${visible.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((s) => s.status === "active").length,
      pending: items.filter((s) => s.status === "pending").length,
      totalSaved: items
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + s.amount, 0),
    }),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ScholarshipSchema) => {
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

  const columns: Column<Scholarship>[] = [
    {
      key: "code",
      header: "ID",
      sortable: true,
      render: (s) => <span className="font-semibold text-primary">{s.code}</span>,
    },
    {
      key: "student",
      header: "Student",
      sortable: true,
      render: (s) => {
        const tc = typeStyles[s.type] ?? fallbackType;
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", tc.tile)}>
              <Award className="size-4" />
            </div>
            <span className="whitespace-nowrap font-medium text-text">{s.student}</span>
          </div>
        );
      },
    },
    { key: "class", header: "Class", render: (s) => <Badge variant="info">{s.class}</Badge> },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (s) => (
        <Badge variant={(typeStyles[s.type] ?? fallbackType).variant}>{s.type}</Badge>
      ),
    },
    {
      key: "percentage",
      header: "Concession",
      sortable: true,
      render: (s) => {
        const tc = typeStyles[s.type] ?? fallbackType;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
              <div className={cn("h-full rounded-full", tc.bar)} style={{ width: `${s.percentage}%` }} />
            </div>
            <span className="font-medium text-text">{s.percentage}%</span>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Amount Waived",
      sortable: true,
      align: "right",
      render: (s) => (
        <span className="whitespace-nowrap font-semibold text-primary">{inr.format(s.amount)}</span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      className: "max-w-45",
      render: (s) => <span className="block truncate text-muted">{s.reason}</span>,
    },
    {
      key: "since",
      header: "Since",
      sortable: true,
      render: (s) => <span className="whitespace-nowrap text-subtle">{s.since}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s) => {
        const sc = statusConfig[s.status] ?? fallbackStatus;
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1.5">
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
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(s);
              setFormOpen(true);
            }}
            title="Edit"
            aria-label={`Edit scholarship ${s.code}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(s)}
            title="Delete"
            aria-label={`Delete scholarship ${s.code}`}
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
        title="Scholarships & Concessions"
        description="Manage fee waivers, merit and need-based scholarships"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add Scholarship
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Scholarships" value={stats.total} icon={GraduationCap} tone="violet" />
        <StatCard label="Active" value={stats.active} icon={CheckCircle} tone="emerald" />
        <StatCard label="Total Fee Waived" value={inr.format(stats.totalSaved)} icon={HeartHandshake} tone="violet" />
        <StatCard label="Pending Review" value={stats.pending} icon={Clock} tone="amber" />
      </div>

      {/* Scholarship Type Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.keys(typeStyles).map((type) => {
          const active = items.filter((s) => s.type === type && s.status === "active");
          const total = active.reduce((sum, s) => sum + s.amount, 0);
          const tc = typeStyles[type];
          return (
            <Card key={type}>
              <CardContent>
                <div className="mb-2.5 flex items-center gap-2">
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", tc.tile)}>
                    <Award className="size-4" />
                  </div>
                  <span className="text-sm font-semibold text-text">{type}</span>
                </div>
                <p className="text-xl font-semibold text-text">{active.length}</p>
                <p className="mt-0.5 text-xs text-subtle">{inr.format(total)} waived</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search scholarships…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search scholarships"
          />
        </div>
        <p className="text-xs text-muted">{visible.length} records</p>
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
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No scholarships found"
          emptyDescription={
            search || activeTab !== "All"
              ? "Try adjusting your filters to see more results."
              : "Award your first scholarship to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add Scholarship
            </Button>
          }
        />
      )}

      <ScholarshipFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete scholarship?"
        description={
          pendingDelete
            ? `${pendingDelete.student}'s ${pendingDelete.type} scholarship (${pendingDelete.code}) will be permanently removed. This cannot be undone.`
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
