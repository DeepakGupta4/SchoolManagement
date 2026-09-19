"use client";

import { useMemo, useState } from "react";
import { CalendarX, CalendarClock, CalendarCheck, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { holidaysApi, type Holiday } from "@/lib/api/holidays";
import type { HolidaySchema } from "@/lib/schemas/holiday";
import { DetailModal } from "@/components/DetailModal";
import { HolidayFormModal } from "./HolidayFormModal";

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Human-friendly date, e.g. "15 Aug 2026". Falls back to the raw string. */
function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const typeVariant: Record<string, "info" | "success" | "warning" | "default"> = {
  Holiday: "info",
  Festival: "success",
  Vacation: "warning",
  Event: "default",
};

export default function HolidaysPage() {
  const [search, setSearch] = useState("");

  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    holidaysApi,
    filters,
    { label: "holiday", describe: (h) => h.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [viewing, setViewing] = useState<Holiday | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Holiday | null>(null);

  const today = todayIso();

  const stats = useMemo(() => {
    const upcoming = items.filter((h) => h.date >= today).length;
    const thisYear = items.filter((h) => h.date.slice(0, 4) === today.slice(0, 4)).length;
    return { total: items.length, upcoming, thisYear };
  }, [items, today]);

  // Show soonest-first: upcoming dates ascending, then past ones.
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.date.localeCompare(b.date)),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: HolidaySchema) => {
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

  const columns: Column<Holiday>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (h) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md gradient-indigo text-white">
            <CalendarX className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{formatDate(h.date)}</p>
            {h.date >= today ? (
              <p className="truncate text-xs text-success-text">Upcoming</p>
            ) : (
              <p className="truncate text-xs text-subtle">Past</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (h) => <span className="font-medium text-text">{h.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (h) =>
        h.type ? (
          <Badge variant={typeVariant[h.type] ?? "default"}>{h.type}</Badge>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (h) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewing(h)}
            aria-label={`View ${h.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditing(h);
              setFormOpen(true);
            }}
            aria-label={`Edit ${h.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(h)}
            aria-label={`Delete ${h.name}`}
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
        title="Holidays"
        description="Mark the days the school is closed. Attendance is skipped on these dates."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add holiday
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total holidays" value={stats.total} icon={CalendarX} tone="indigo" />
        <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarClock} tone="violet" />
        <StatCard label="This year" value={stats.thisYear} icon={CalendarCheck} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search holidays"
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
          rows={sorted}
          rowKey={(h) => h.id}
          loading={loading}
          emptyTitle="No holidays yet"
          emptyDescription={
            search
              ? "Try clearing your search to see more results."
              : "Add your first holiday to keep attendance accurate."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add holiday
            </Button>
          }
        />
      )}

      <HolidayFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.name ?? "Holiday"}
        description={viewing ? formatDate(viewing.date) : ""}
        rows={
          viewing
            ? [
                { label: "Name", value: viewing.name },
                { label: "Date", value: formatDate(viewing.date) },
                { label: "Type", value: viewing.type || "—" },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete holiday?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be permanently removed. This cannot be undone.`
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
