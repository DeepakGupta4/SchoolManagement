"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Users,
  Briefcase,
  Clock,
  UserCheck,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import {
  staffApi,
  STAFF_DEPT_OPTIONS,
  STAFF_TYPE_OPTIONS,
  STAFF_STATUS_OPTIONS,
  type StaffMember,
} from "@/lib/api/staff";
import type { StaffSchema } from "@/lib/schemas/staff";
import { StaffFormModal } from "./StaffFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

/** Departments map onto the semantic badge palette — no per-department hexes. */
const DEPT_VARIANT: Record<string, BadgeVariant> = {
  Administration: "info",
  Finance: "success",
  HR: "default",
  IT: "info",
  Library: "warning",
  Security: "danger",
  Transport: "default",
  Health: "danger",
  Canteen: "warning",
};

const STATUS_META: Record<string, { variant: BadgeVariant; dot: string; label: string }> = {
  active: { variant: "success", dot: "bg-success", label: "Active" },
  "on-leave": { variant: "warning", dot: "bg-warning", label: "On Leave" },
  inactive: { variant: "default", dot: "bg-subtle", label: "Inactive" },
};

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filters = useMemo(
    () => ({ search, dept: deptFilter, type: typeFilter, status: statusFilter }),
    [search, deptFilter, typeFilter, statusFilter]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    staffApi,
    filters,
    { label: "staff member", describe: (s) => s.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StaffMember | null>(null);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((s) => s.status === "active").length,
      onLeave: items.filter((s) => s.status === "on-leave").length,
      partTime: items.filter((s) => s.type === "Part-time").length,
    }),
    [items]
  );

  const deptCounts = useMemo(
    () =>
      STAFF_DEPT_OPTIONS.map((dept) => ({
        dept,
        count: items.filter((s) => s.dept === dept).length,
      })),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: StaffSchema) => {
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

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Staff Member",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-subtle">{s.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (s) => <span className="whitespace-nowrap text-muted">{s.role}</span>,
    },
    {
      key: "dept",
      header: "Department",
      sortable: true,
      render: (s) => <Badge variant={DEPT_VARIANT[s.dept] ?? "default"}>{s.dept}</Badge>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (s) => (
        <Badge variant={s.type === "Full-time" ? "success" : "warning"}>{s.type}</Badge>
      ),
    },
    {
      key: "salary",
      header: "Salary",
      sortable: true,
      align: "right",
      render: (s) => <span className="whitespace-nowrap font-medium text-text">{inr(s.salary)}</span>,
    },
    {
      key: "join",
      header: "Join Date",
      render: (s) => <span className="whitespace-nowrap text-muted">{s.join}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      render: (s) => (
        <div className="flex flex-col gap-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3 text-subtle" />
            {s.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="size-3 text-subtle" />
            {s.email}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s) => {
        const meta = STATUS_META[s.status] ?? STATUS_META.inactive;
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
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
            aria-label={`Edit ${s.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(s)}
            aria-label={`Delete ${s.name}`}
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
        title="Staff Management"
        description="Manage non-teaching staff across all departments"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add Staff
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Staff" value={stats.total} icon={Users} tone="cyan" />
        <StatCard label="Active" value={stats.active} icon={UserCheck} tone="emerald" />
        <StatCard label="On Leave" value={stats.onLeave} icon={Clock} tone="amber" />
        <StatCard label="Part-time" value={stats.partTime} icon={Briefcase} tone="violet" />
      </div>

      {/* Department summary — each tile toggles the department filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {deptCounts.map(({ dept, count }) => {
          const active = deptFilter === dept;
          return (
            <button
              key={dept}
              onClick={() => setDeptFilter(active ? "All" : dept)}
              aria-pressed={active}
              className={`focus-ring rounded-md border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface-raised hover:bg-surface-hover"
              }`}
            >
              <p
                className={`truncate text-[10px] font-semibold uppercase tracking-widest ${
                  active ? "text-primary-text" : "text-subtle"
                }`}
              >
                {dept}
              </p>
              <p className="mt-1 text-xl font-semibold text-text">{count}</p>
              <p className="text-xs text-muted">members</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, role or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search staff"
          />
        </div>
        <div className="w-48">
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={[
              { label: "All Departments", value: "All" },
              ...STAFF_DEPT_OPTIONS.map((d) => ({ label: d, value: d })),
            ]}
            aria-label="Filter by department"
          />
        </div>
        <div className="w-40">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { label: "All Types", value: "All" },
              ...STAFF_TYPE_OPTIONS.map((t) => ({ label: t, value: t })),
            ]}
            aria-label="Filter by employment type"
          />
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[{ label: "All Status", value: "All" }, ...STAFF_STATUS_OPTIONS]}
            aria-label="Filter by status"
          />
        </div>
        <p className="ml-auto text-xs text-subtle">{items.length} staff members</p>
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
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No staff found"
          emptyDescription="Try adjusting your filters"
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add Staff
            </Button>
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <p>
          Showing <strong className="font-semibold text-text">{items.length}</strong> staff members
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {["active", "on-leave", "inactive"].map((st) => {
            const meta = STATUS_META[st];
            const count = items.filter((s) => s.status === st).length;
            return (
              <span key={st} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${meta.dot}`} />
                {meta.label}: <strong className="font-semibold text-text">{count}</strong>
              </span>
            );
          })}
        </div>
      </div>

      <StaffFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete staff member?"
        description={
          pendingDelete
            ? `${pendingDelete.name} (${pendingDelete.employeeId}) will be permanently removed. This cannot be undone.`
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
