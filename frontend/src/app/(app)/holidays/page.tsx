"use client";

import { useMemo, useState } from "react";
import {
  CalendarX,
  CalendarClock,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
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
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useResource } from "@/hooks/useResource";
import { holidaysApi, type Holiday } from "@/lib/api/holidays";
import type { HolidaySchema } from "@/lib/schemas/holiday";
import { DetailModal } from "@/components/DetailModal";
import { HolidayFormModal } from "./HolidayFormModal";

const todayIso = () => new Date().toISOString().slice(0, 10);

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Fixed-date national holidays (MM-DD → name). Shown as faint suggestions on
 * their dates. Lunar/festival dates shift each year, so they are not included.
 */
const NATIONAL_HOLIDAYS: Record<string, string> = {
  "01-01": "New Year's Day",
  "01-26": "Republic Day",
  "08-15": "Independence Day",
  "10-02": "Gandhi Jayanti",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  // Prefill values for the create modal (from a clicked calendar cell/suggestion).
  const [createDate, setCreateDate] = useState<string | undefined>(undefined);
  const [createName, setCreateName] = useState<string | undefined>(undefined);

  // Which month the calendar is showing (defaults to the current month).
  const [cal, setCal] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const today = todayIso();

  // Fast lookup of a holiday by its date for the calendar cells.
  const holidayByDate = useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const h of items) map.set(h.date, h);
    return map;
  }, [items]);

  // Grid cells for the shown month: leading blanks (so day 1 lands on its
  // weekday) followed by each day of the month.
  const calendarCells = useMemo(() => {
    const startWeekday = new Date(cal.year, cal.month, 1).getDay();
    const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cal]);

  const prevMonth = () =>
    setCal((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const nextMonth = () =>
    setCal((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));
  const goToday = () => {
    const d = new Date();
    setCal({ year: d.getFullYear(), month: d.getMonth() });
  };

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
    setCreateDate(undefined);
    setCreateName(undefined);
    setFormOpen(true);
  };

  /** Open the create modal prefilled from a calendar cell / suggestion. */
  const openCreateFor = (date: string, name?: string) => {
    setEditing(null);
    setCreateDate(date);
    setCreateName(name);
    setFormOpen(true);
  };

  const openEdit = (h: Holiday) => {
    setEditing(h);
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
            onClick={() => openEdit(h)}
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

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-text">
              {MONTH_NAMES[cal.month]} {cal.year}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToday}>
                Today
              </Button>
              <button
                onClick={prevMonth}
                aria-label="Previous month"
                className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={nextMonth}
                aria-label="Next month"
                className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="pb-1 text-center text-xs font-medium text-subtle">
                {w}
              </div>
            ))}

            {calendarCells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} className="min-h-16 rounded-md" />;

              const iso = `${cal.year}-${pad2(cal.month + 1)}-${pad2(day)}`;
              const isSunday = i % 7 === 0;
              const isToday = iso === today;
              const dayHoliday = holidayByDate.get(iso);
              const suggestion = NATIONAL_HOLIDAYS[`${pad2(cal.month + 1)}-${pad2(day)}`];

              return (
                <button
                  key={iso}
                  onClick={() =>
                    dayHoliday ? openEdit(dayHoliday) : openCreateFor(iso, suggestion)
                  }
                  title={
                    dayHoliday
                      ? `Edit ${dayHoliday.name}`
                      : suggestion
                        ? `Add ${suggestion}`
                        : "Add holiday"
                  }
                  className={cn(
                    "focus-ring flex min-h-16 flex-col items-stretch gap-1 rounded-md border p-1.5 text-left transition-colors hover:bg-surface-hover",
                    isToday ? "border-indigo-500" : "border-border"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isToday ? "text-indigo-500" : isSunday ? "text-subtle" : "text-text"
                    )}
                  >
                    {day}
                  </span>

                  {dayHoliday ? (
                    <span className="truncate rounded bg-info-soft px-1 py-0.5 text-[10px] font-medium text-info-text">
                      {dayHoliday.name}
                    </span>
                  ) : suggestion ? (
                    <span className="truncate rounded border border-dashed border-border px-1 py-0.5 text-[10px] font-medium text-subtle opacity-70">
                      {suggestion}
                    </span>
                  ) : isSunday ? (
                    <span className="text-[10px] text-subtle">Sunday</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-subtle">
            Sundays are weekly holidays. Click any day to add a holiday, a faded name to add a
            suggested national holiday, or a holiday to edit it.
          </p>
        </CardContent>
      </Card>

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
        defaultDate={createDate}
        defaultName={createName}
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
