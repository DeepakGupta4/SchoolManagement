"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Download,
  IndianRupee,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Wallet,
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
  Pagination,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  departmentsApi,
  DEPARTMENT_BLOCK_OPTIONS,
  DEPARTMENT_STATUS_OPTIONS,
  type Department,
} from "@/lib/api/departments";
import type { DepartmentSchema } from "@/lib/schemas/department";
import { DepartmentFormModal } from "./DepartmentFormModal";

const PAGE_SIZE = 8;

const STATUS_VARIANT: Record<string, "success" | "warning" | "info"> = {
  active: "success",
  review: "warning",
  planned: "info",
};

const BLOCK_OPTIONS = DEPARTMENT_BLOCK_OPTIONS.map((b) => ({ label: b, value: b }));

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Spent-vs-budget meter. Turns amber past 75% and red once overspent. */
function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const fill = pct >= 95 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-success";

  return (
    <div className="min-w-32">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-text">{inr(spent)}</span>
        <span className="text-subtle">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [block, setBlock] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({ search, block, status }), [search, block, status]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    departmentsApi,
    filters,
    { label: "department", describe: (d) => d.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null);
  const { toast } = useToast();

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const totalTeachers = items.reduce((sum, d) => sum + d.teachers, 0);
    const totalBudget = items.reduce((sum, d) => sum + d.budget, 0);
    const totalSpent = items.reduce((sum, d) => sum + d.spent, 0);
    return {
      count: items.length,
      totalTeachers,
      totalBudget,
      utilisation: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    };
  }, [items]);

  /** Every filter here is applied server-side, so `items` is what the table shows. */
  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No departments match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Department>(
      "departments",
      [
        { header: "Code", value: (d) => d.code },
        { header: "Department", value: (d) => d.name },
        { header: "Block", value: (d) => d.block },
        { header: "Head of Dept.", value: (d) => d.hod },
        { header: "Teachers", value: (d) => d.teachers },
        { header: "Subjects", value: (d) => d.subjects.join("; ") },
        { header: "Annual Budget", value: (d) => d.budget },
        { header: "Spent", value: (d) => d.spent },
        {
          header: "Utilisation (%)",
          value: (d) => (d.budget > 0 ? Math.round((d.spent / d.budget) * 100) : 0),
        },
        {
          header: "Status",
          value: (d) => d.status.charAt(0).toUpperCase() + d.status.slice(1),
        },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} department${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: DepartmentSchema) => {
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

  const columns: Column<Department>[] = [
    {
      key: "name",
      header: "Department",
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md gradient-indigo text-xs font-semibold text-white">
            {d.code}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{d.name}</p>
            <p className="truncate text-xs text-subtle">{d.block}</p>
          </div>
        </div>
      ),
    },
    {
      key: "hod",
      header: "Head of Dept.",
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={d.hod} size="sm" />
          <span className="whitespace-nowrap font-medium text-text">{d.hod}</span>
        </div>
      ),
    },
    {
      key: "teachers",
      header: "Teachers",
      sortable: true,
      align: "right",
      render: (d) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-text">
          <Users className="size-3.5 text-subtle" />
          {d.teachers}
        </span>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      render: (d) => (
        <div className="flex flex-wrap gap-1">
          {d.subjects.map((s) => (
            <Badge key={s} variant="info">
              {s}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "budget",
      header: "Annual budget",
      sortable: true,
      align: "right",
      render: (d) => <span className="whitespace-nowrap text-muted">{inr(d.budget)}</span>,
    },
    {
      key: "spent",
      header: "Utilisation",
      sortable: true,
      render: (d) => <BudgetBar spent={d.spent} budget={d.budget} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (d) => (
        <Badge variant={STATUS_VARIANT[d.status] ?? "info"} className="capitalize">
          {d.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(d);
              setFormOpen(true);
            }}
            aria-label={`Edit ${d.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(d)}
            aria-label={`Delete ${d.name}`}
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
        title="Departments"
        description="Academic departments, their heads, staffing and annual budgets."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New department
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Departments" value={stats.count} icon={Building2} tone="indigo" />
        <StatCard label="Teaching staff" value={stats.totalTeachers} icon={Users} tone="emerald" />
        <StatCard label="Total budget" value={inr(stats.totalBudget)} icon={IndianRupee} tone="violet" />
        <StatCard
          label="Budget utilised"
          value={stats.utilisation}
          suffix="%"
          icon={Wallet}
          tone="amber"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by department, code, HOD or subject…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search departments"
          />
        </div>
        <div className="w-52">
          <Select
            value={block}
            onChange={(e) => applyFilter(setBlock)(e.target.value)}
            placeholder="All blocks"
            options={BLOCK_OPTIONS}
            aria-label="Filter by block"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={DEPARTMENT_STATUS_OPTIONS}
            aria-label="Filter by status"
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
        <>
          <Table
            columns={columns}
            rows={paged}
            rowKey={(d) => d.id}
            loading={loading}
            rowClassName={(d) => (d.status === "planned" ? "opacity-70" : undefined)}
            emptyTitle="No departments found"
            emptyDescription={
              search || block || status
                ? "Try clearing your filters to see more results."
                : "Add your first department to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                New department
              </Button>
            }
          />

          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={items.length}
            onPageChange={setPage}
          />
        </>
      )}

      <DepartmentFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete department?"
        description={
          pendingDelete
            ? `${pendingDelete.name} (${pendingDelete.code}) and its ${pendingDelete.subjects.length} subject(s) will be permanently removed. This cannot be undone.`
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
