"use client";

import { useMemo, useState } from "react";
import {
  CalendarRange,
  Download,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Users,
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
  Tooltip,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  allocationsApi,
  loadBandLabel,
  loadPercent,
  ALLOCATION_CLASS_OPTIONS,
  ALLOCATION_DEPT_OPTIONS,
  LOAD_BAND_OPTIONS,
  MAX_PERIODS,
  type Allocation,
  type LoadBand,
} from "@/lib/api/allocations";
import type { AllocationSchema } from "@/lib/schemas/allocation";
import { AllocationFormModal } from "./AllocationFormModal";

const PAGE_SIZE = 10;

const DEPT_OPTIONS = ALLOCATION_DEPT_OPTIONS.map((d) => ({ label: d, value: d }));

const CLASS_OPTIONS = ALLOCATION_CLASS_OPTIONS.map((c) => ({ label: `Class ${c}`, value: c }));

/** Workload bands share the status palette — no per-band hexes. */
const BAND_META: Record<LoadBand, { variant: "danger" | "success" | "info" | "warning"; fill: string }> = {
  Overloaded: { variant: "danger", fill: "bg-danger" },
  Optimal: { variant: "success", fill: "bg-success" },
  Moderate: { variant: "info", fill: "bg-info" },
  "Under-used": { variant: "warning", fill: "bg-warning" },
};

function WorkloadBar({ periods }: { periods: number }) {
  const pct = loadPercent(periods);
  const label = loadBandLabel(periods);
  const meta = BAND_META[label];

  return (
    <Tooltip content={`${periods} of ${MAX_PERIODS} periods — ${label}`} side="top">
      <div className="min-w-36">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-text">{periods} p/w</span>
          <span className="text-subtle">{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div className={`h-full rounded-full ${meta.fill}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Tooltip>
  );
}

export default function AllocationPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [klass, setKlass] = useState("");
  const [load, setLoad] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({ search, dept, klass, load }), [search, dept, klass, load]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    allocationsApi,
    filters,
    { label: "allocation", describe: (a) => `${a.subject} — ${a.teacher}` }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Allocation | null>(null);
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
    const totalPeriods = items.reduce((sum, a) => sum + a.periods, 0);
    const overloaded = items.filter((a) => loadBandLabel(a.periods) === "Overloaded").length;
    return {
      teachers: items.length,
      totalPeriods,
      avgLoad: items.length ? Math.round(totalPeriods / items.length) : 0,
      overloaded,
    };
  }, [items]);

  /** One row per allocation across the whole filtered matrix, not just this page. */
  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No allocations match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Allocation>(
      "subject-allocation",
      [
        { header: "Employee ID", value: (a) => a.empId },
        { header: "Teacher", value: (a) => a.teacher },
        { header: "Subject", value: (a) => a.subject },
        { header: "Department", value: (a) => a.dept },
        { header: "Classes", value: (a) => a.classes.join("; ") },
        { header: "Room", value: (a) => a.room },
        { header: "Lab Periods / Week", value: (a) => a.labs },
        { header: "Periods / Week", value: (a) => a.periods },
        { header: "Period Cap", value: () => MAX_PERIODS },
        { header: "Load (%)", value: (a) => loadPercent(a.periods) },
        { header: "Load Band", value: (a) => loadBandLabel(a.periods) },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} allocation${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: AllocationSchema) => {
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

  const columns: Column<Allocation>[] = [
    {
      key: "teacher",
      header: "Teacher",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.teacher} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{a.teacher}</p>
            <p className="truncate text-xs text-subtle">{a.empId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (a) => (
        <div className="min-w-0">
          <Badge variant="info">{a.subject}</Badge>
          <p className="mt-1 truncate text-xs text-subtle">{a.dept}</p>
        </div>
      ),
    },
    {
      key: "classes",
      header: "Classes",
      render: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.classes.map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-sm border border-border bg-surface-sunken px-1.5 py-0.5 text-xs font-medium text-muted"
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.room}</span>,
    },
    {
      key: "labs",
      header: "Lab",
      sortable: true,
      align: "right",
      render: (a) =>
        a.labs > 0 ? (
          <span className="whitespace-nowrap text-muted">{a.labs} p/w</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "periods",
      header: "Weekly workload",
      sortable: true,
      render: (a) => <WorkloadBar periods={a.periods} />,
    },
    {
      key: "band",
      header: "Load",
      sortable: true,
      sortValue: (a) => a.periods,
      render: (a) => {
        const label = loadBandLabel(a.periods);
        return <Badge variant={BAND_META[label].variant}>{label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(a);
              setFormOpen(true);
            }}
            aria-label={`Edit allocation for ${a.teacher}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(a)}
            aria-label={`Delete allocation for ${a.teacher}`}
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
        title="Subject allocation"
        description="Teacher × class × subject matrix with weekly period load and overload flags."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export matrix
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Allocate subject
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Teachers allocated" value={stats.teachers} icon={Users} tone="indigo" />
        <StatCard label="Periods / week" value={stats.totalPeriods} icon={CalendarRange} tone="cyan" />
        <StatCard
          label="Average load"
          value={stats.avgLoad}
          suffix=" p/w"
          icon={GraduationCap}
          tone="emerald"
          sub={`Cap is ${MAX_PERIODS} periods`}
        />
        <StatCard label="Overloaded" value={stats.overloaded} icon={TriangleAlert} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by teacher, employee ID, subject or class…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search allocations"
          />
        </div>
        <div className="w-52">
          <Select
            value={dept}
            onChange={(e) => applyFilter(setDept)(e.target.value)}
            placeholder="All departments"
            options={DEPT_OPTIONS}
            aria-label="Filter by department"
          />
        </div>
        <div className="w-40">
          <Select
            value={klass}
            onChange={(e) => applyFilter(setKlass)(e.target.value)}
            placeholder="All classes"
            options={CLASS_OPTIONS}
            aria-label="Filter by class"
          />
        </div>
        <div className="w-44">
          <Select
            value={load}
            onChange={(e) => applyFilter(setLoad)(e.target.value)}
            placeholder="All loads"
            options={LOAD_BAND_OPTIONS.map((b) => ({ label: b, value: b }))}
            aria-label="Filter by workload band"
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
            rowKey={(a) => a.id}
            loading={loading}
            rowClassName={(a) =>
              loadBandLabel(a.periods) === "Overloaded" ? "bg-danger-soft" : undefined
            }
            emptyTitle="No allocations found"
            emptyDescription={
              search || dept || klass || load
                ? "Try clearing your filters to see more results."
                : "Allocate your first subject to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                Allocate subject
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

      <AllocationFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete allocation?"
        description={
          pendingDelete
            ? `${pendingDelete.subject} for ${pendingDelete.teacher} (${pendingDelete.empId}) across ${pendingDelete.classes.length} class(es) will be permanently removed. This cannot be undone.`
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
