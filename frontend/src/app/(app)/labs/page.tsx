"use client";

import { useMemo, useState } from "react";
import {
  Atom,
  CalendarClock,
  FlaskConical,
  Microscope,
  Monitor,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  Tooltip,
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import {
  labsApi,
  LAB_STATUS_OPTIONS,
  LAB_TYPE_OPTIONS,
  type Lab,
  type LabStatus,
  type LabType,
} from "@/lib/api/labs";
import type { LabSchema } from "@/lib/schemas/lab";
import { LabFormModal } from "./LabFormModal";

const PAGE_SIZE = 10;

const LAB_ICON: Record<LabType, typeof Atom> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Microscope,
  Computer: Monitor,
};

const LAB_GRADIENT: Record<LabType, string> = {
  Physics: "gradient-indigo",
  Chemistry: "gradient-amber",
  Biology: "gradient-emerald",
  Computer: "gradient-cyan",
};

const STATUS_VARIANT: Record<LabStatus, "success" | "warning" | "danger"> = {
  operational: "success",
  maintenance: "warning",
  closed: "danger",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export default function LabsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({ search, type, status }), [search, type, status]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    labsApi,
    filters,
    { label: "lab", describe: (l) => l.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lab | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Lab | null>(null);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const stats = useMemo(() => {
    const equipment = items.reduce((sum, l) => sum + l.equipmentTotal, 0);
    const faulty = items.reduce((sum, l) => sum + (l.equipmentTotal - l.equipmentWorking), 0);
    const practicals = items.reduce((sum, l) => sum + l.weeklyPracticals, 0);
    return { labs: items.length, equipment, faulty, practicals };
  }, [items]);

  const typeSummary = useMemo(
    () =>
      LAB_TYPE_OPTIONS.map(({ value }) => {
        const group = items.filter((l) => l.type === value);
        return {
          type: value,
          count: group.length,
          seats: group.reduce((sum, l) => sum + l.capacity, 0),
          practicals: group.reduce((sum, l) => sum + l.weeklyPracticals, 0),
        };
      }),
    [items]
  );

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: LabSchema) => {
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

  const columns: Column<Lab>[] = [
    {
      key: "name",
      header: "Lab",
      sortable: true,
      sortValue: (l) => l.name,
      render: (l) => {
        const Icon = LAB_ICON[l.type];
        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-md text-white ${LAB_GRADIENT[l.type]}`}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{l.name}</p>
              <p className="truncate text-xs text-subtle">{l.block}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (l) => <Badge variant="info">{l.type}</Badge>,
    },
    {
      key: "inCharge",
      header: "Lab in-charge",
      sortable: true,
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={l.inCharge} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-muted">{l.inCharge}</p>
            <p className="truncate text-xs text-subtle">Asst. {l.assistant}</p>
          </div>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Seats",
      sortable: true,
      align: "right",
      render: (l) => <span className="whitespace-nowrap text-muted">{l.capacity}</span>,
    },
    {
      key: "equipmentWorking",
      header: "Equipment",
      sortable: true,
      sortValue: (l) => (l.equipmentTotal ? l.equipmentWorking / l.equipmentTotal : 0),
      render: (l) => {
        const pct = l.equipmentTotal
          ? Math.round((l.equipmentWorking / l.equipmentTotal) * 100)
          : 0;
        const faulty = l.equipmentTotal - l.equipmentWorking;
        return (
          <div className="min-w-32">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-text">
                {l.equipmentWorking}/{l.equipmentTotal}
              </span>
              <span className={faulty > 10 ? "text-danger-text" : "text-subtle"}>{pct}% ok</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={
                  pct >= 95
                    ? "h-full rounded-full bg-success"
                    : pct >= 85
                      ? "h-full rounded-full bg-warning"
                      : "h-full rounded-full bg-danger"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "nextPractical",
      header: "Next practical",
      sortable: true,
      render: (l) => (
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
            <CalendarClock className="size-3.5 text-subtle" />
            {formatDate(l.nextPractical)}
          </p>
          <p className="mt-0.5 truncate text-xs text-subtle">{l.nextPracticalClass}</p>
        </div>
      ),
    },
    {
      key: "weeklyPracticals",
      header: "Per week",
      sortable: true,
      align: "right",
      render: (l) => (
        <Tooltip content={`${l.weeklyPracticals} scheduled practical sessions each week`}>
          <span className="whitespace-nowrap font-medium text-text">{l.weeklyPracticals}</span>
        </Tooltip>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (l) => (
        <Badge variant={STATUS_VARIANT[l.status]} className="capitalize">
          {l.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(l);
              setFormOpen(true);
            }}
            aria-label={`Edit ${l.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(l)}
            aria-label={`Delete ${l.name}`}
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
        title="Laboratories"
        description="Equipment inventory, capacity, lab in-charge and the practicals timetable."
        actions={
          <>
            <Button variant="outline">
              <Wrench className="size-4" />
              Log maintenance
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add lab
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total labs" value={stats.labs} icon={FlaskConical} tone="indigo" />
        <StatCard label="Equipment items" value={stats.equipment} icon={Package} tone="cyan" />
        <StatCard label="Needs repair" value={stats.faulty} icon={TriangleAlert} tone="rose" />
        <StatCard
          label="Practicals / week"
          value={stats.practicals}
          icon={CalendarClock}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {typeSummary.map((group) => {
          const Icon = LAB_ICON[group.type];
          return (
            <Card key={group.type}>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-md text-white ${LAB_GRADIENT[group.type]}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <p className="text-sm font-medium text-text">{group.type}</p>
                </div>
                <Badge variant="outline">{group.count} labs</Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Seats</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-lg font-semibold text-text">
                    <Users className="size-4 text-subtle" />
                    {group.seats}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Practicals / week</p>
                  <p className="mt-0.5 text-lg font-semibold text-text">{group.practicals}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by lab, in-charge or block…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search labs"
          />
        </div>
        <div className="w-44">
          <Select
            value={type}
            onChange={(e) => applyFilter(setType)(e.target.value)}
            placeholder="All lab types"
            options={LAB_TYPE_OPTIONS}
            aria-label="Filter by lab type"
          />
        </div>
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={LAB_STATUS_OPTIONS}
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
            rowKey={(l) => l.id}
            loading={loading}
            rowClassName={(l) => (l.status === "closed" ? "opacity-60" : undefined)}
            emptyTitle="No labs found"
            emptyDescription={
              search || type || status
                ? "Try clearing your filters to see more results."
                : "Add your first lab to get started."
            }
            emptyAction={
              search || type || status ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setType("");
                    setStatus("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="size-4" />
                  Add lab
                </Button>
              )
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

      <LabFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete lab?"
        description={
          pendingDelete
            ? `${pendingDelete.name} and its ${pendingDelete.equipmentTotal} equipment record(s) will be permanently removed. This cannot be undone.`
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
