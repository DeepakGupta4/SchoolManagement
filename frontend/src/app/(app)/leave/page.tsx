"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Check,
  X,
  Pencil,
  Trash2,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  leaveRequestsApi,
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  type LeaveRequest,
} from "@/lib/api/leaveRequests";
import type { LeaveRequestSchema } from "@/lib/schemas/leaveRequest";
import { LeaveFormModal } from "./LeaveFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const STATUS_META: Record<string, { variant: BadgeVariant; dot: string }> = {
  Pending: { variant: "warning", dot: "bg-warning" },
  Approved: { variant: "success", dot: "bg-success" },
  Rejected: { variant: "danger", dot: "bg-danger" },
};

const LEAVE_TYPE_VARIANT: Record<string, BadgeVariant> = {
  "Sick Leave": "danger",
  "Casual Leave": "info",
  "Earned Leave": "success",
  "Maternity Leave": "default",
};

const tabs = ["Requests", "Leave Balance"] as const;

export default function LeavePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Requests");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // `statusFilter` is deliberately left out of the server filters: the stat
  // cards and the status legend need per-status counts across the whole
  // (otherwise filtered) set, so status narrowing is applied during render.
  const filters = useMemo(() => ({ search, type: typeFilter }), [search, typeFilter]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    leaveRequestsApi,
    filters,
    { label: "leave request", describe: (l) => `${l.code} — ${l.name}` }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LeaveRequest | null>(null);
  const { toast } = useToast();

  // Rows for the table only — stat cards keep counting the full `items`.
  const visible = useMemo(
    () => (statusFilter === "All" ? items : items.filter((l) => l.status === statusFilter)),
    [items, statusFilter]
  );

  const handleExport = () => {
    if (visible.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No leave requests match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<LeaveRequest>(
      "leave-requests",
      [
        { header: "Code", value: (l) => l.code },
        { header: "Name", value: (l) => l.name },
        { header: "Role", value: (l) => l.role },
        { header: "Department", value: (l) => l.dept },
        { header: "Leave Type", value: (l) => l.type },
        { header: "From", value: (l) => l.from },
        { header: "To", value: (l) => l.to },
        { header: "Days", value: (l) => l.days },
        { header: "Reason", value: (l) => l.reason },
        { header: "Status", value: (l) => l.status },
      ],
      visible
    );
    toast({
      title: "Export ready",
      description: `${visible.length} leave request${visible.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const stats = useMemo(
    () => ({
      pending: items.filter((l) => l.status === "Pending").length,
      approved: items.filter((l) => l.status === "Approved").length,
      rejected: items.filter((l) => l.status === "Rejected").length,
      onLeave: items.filter((l) => l.status === "Approved" && l.days <= 5).length,
    }),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: LeaveRequestSchema) => {
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

  /** Approve / reject in place — save() refetches and toasts for us. */
  const decide = (row: LeaveRequest, status: "Approved" | "Rejected") =>
    save({ ...row, status }, row);

  const requestColumns: Column<LeaveRequest>[] = [
    {
      key: "name",
      header: "Staff Member",
      sortable: true,
      render: (l) => (
        <div className="flex items-center gap-3">
          <Avatar name={l.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{l.name}</p>
            <p className="truncate text-xs text-subtle">{l.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Leave Type",
      sortable: true,
      render: (l) => (
        <Badge variant={LEAVE_TYPE_VARIANT[l.type] ?? "default"}>{l.type}</Badge>
      ),
    },
    {
      key: "from",
      header: "From",
      render: (l) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-muted">
          <CalendarDays className="size-3.5 text-subtle" />
          {l.from}
        </span>
      ),
    },
    {
      key: "to",
      header: "To",
      render: (l) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-muted">
          <CalendarDays className="size-3.5 text-subtle" />
          {l.to}
        </span>
      ),
    },
    {
      key: "days",
      header: "Days",
      sortable: true,
      align: "right",
      render: (l) => (
        <span className="inline-flex rounded-sm bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-text">
          {l.days}d
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (l) => <span className="block max-w-xs truncate text-muted">{l.reason}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (l) => (
        <Badge variant={STATUS_META[l.status]?.variant ?? "default"}>{l.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          {l.status === "Pending" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 hover:bg-success-soft hover:text-success"
                disabled={saving}
                onClick={() => decide(l, "Approved")}
                aria-label={`Approve leave for ${l.name}`}
              >
                <Check className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 hover:bg-danger-soft hover:text-danger"
                disabled={saving}
                onClick={() => decide(l, "Rejected")}
                aria-label={`Reject leave for ${l.name}`}
              >
                <X className="size-4" />
              </Button>
            </>
          )}
          <button
            onClick={() => {
              setEditing(l);
              setFormOpen(true);
            }}
            aria-label={`Edit leave request for ${l.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(l)}
            aria-label={`Delete leave request for ${l.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const isRequests = tab === "Requests";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Leave Management"
        description="Track and manage staff leave requests"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Apply Leave
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle} tone="emerald" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="rose" />
        <StatCard label="On Leave Today" value={stats.onLeave} icon={Users} tone="indigo" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Leave views"
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
                setStatusFilter("All");
                setTypeFilter("All");
              }}
              className={`focus-ring rounded-sm px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t ? "bg-surface-raised text-text shadow-sm" : "text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isRequests && (
          <>
            <div className="min-w-60 flex-1">
              <Input
                type="search"
                placeholder="Search by name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="size-4" />}
                aria-label="Search leave requests"
              />
            </div>
            <div className="w-48">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { label: "All Types", value: "All" },
                  ...LEAVE_TYPE_OPTIONS.map((t) => ({ label: t, value: t })),
                ]}
                aria-label="Filter by leave type"
              />
            </div>
            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: "All Status", value: "All" },
                  ...LEAVE_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
                ]}
                aria-label="Filter by status"
              />
            </div>
            <p className="ml-auto text-xs text-subtle">{visible.length} requests</p>
          </>
        )}
      </div>

      {isRequests ? (
        error ? (
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
            columns={requestColumns}
            rows={visible}
            rowKey={(l) => l.id}
            loading={loading}
            emptyTitle="No leave requests found"
            emptyDescription="Try adjusting your filters"
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                Apply Leave
              </Button>
            }
          />
        )
      ) : (
        <Card>
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="No leave balances yet"
            description="Staff leave balances will appear here once they are set up."
          />
        </Card>
      )}

      {isRequests && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <p>
            Showing <strong className="font-semibold text-text">{visible.length}</strong> requests
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {LEAVE_STATUS_OPTIONS.map((st) => {
              const count = items.filter((l) => l.status === st).length;
              return (
                <span key={st} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${STATUS_META[st].dot}`} />
                  {st}: <strong className="font-semibold text-text">{count}</strong>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <LeaveFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete leave request?"
        description={
          pendingDelete
            ? `${pendingDelete.code} for ${pendingDelete.name} will be permanently removed. This cannot be undone.`
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
