"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Images,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import {
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
  EVENT_CATEGORY_OPTIONS,
  EVENT_STATUS_OPTIONS,
  eventsApi,
  type EventCategory,
  type EventStatus,
  type RegistrationStatus,
  type SchoolEvent,
} from "@/lib/api/events";
import type { EventSchema } from "@/lib/schemas/event";
import { EventFormModal } from "./EventFormModal";

const PAGE_SIZE = 8;

const CATEGORY_VARIANT: Record<EventCategory, "info" | "success" | "warning" | "default"> = {
  Cultural: "info",
  Sports: "success",
  Academic: "warning",
  Competition: "default",
};

const STATUS_VARIANT: Record<EventStatus, "success" | "warning" | "info" | "danger"> = {
  upcoming: "info",
  ongoing: "warning",
  completed: "success",
  cancelled: "danger",
};

const REGISTRATION_VARIANT: Record<
  RegistrationStatus,
  "success" | "warning" | "default" | "outline"
> = {
  open: "success",
  "closing-soon": "warning",
  closed: "default",
  "not-required": "outline",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({ search, category, status }), [search, category, status]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    eventsApi,
    filters,
    { label: "event", describe: (e) => e.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SchoolEvent | null>(null);
  const { toast } = useToast();

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const stats = useMemo(() => {
    const upcoming = items.filter((e) => e.status === "upcoming").length;
    const completed = items.filter((e) => e.status === "completed").length;
    const participants = items.reduce((sum, e) => sum + e.participants, 0);
    const media = items.reduce((sum, e) => sum + e.mediaCount, 0);
    return { upcoming, completed, participants, media };
  }, [items]);

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /** Exports the whole filtered set, not just the visible page. */
  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No events match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<SchoolEvent>(
      "events",
      [
        { header: "Code", value: (e) => e.code },
        { header: "Event", value: (e) => e.name },
        { header: "Category", value: (e) => e.category },
        { header: "Date", value: (e) => formatDate(e.date) },
        { header: "Venue", value: (e) => e.venue },
        { header: "Coordinator", value: (e) => e.coordinator },
        { header: "Participants", value: (e) => e.participants },
        { header: "Capacity", value: (e) => e.capacity },
        { header: "Registration", value: (e) => e.registration },
        { header: "Status", value: (e) => e.status },
        { header: "Media Files", value: (e) => e.mediaCount },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} event${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (event: SchoolEvent) => {
    setEditing(event);
    setFormOpen(true);
  };

  const handleSubmit = async (values: EventSchema) => {
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

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setPage(1);
  };

  const columns: Column<SchoolEvent>[] = [
    {
      key: "name",
      header: "Event",
      sortable: true,
      sortValue: (e) => e.name,
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{e.name}</p>
          <p className="mt-0.5 truncate text-xs text-subtle">
            {e.code} · {e.coordinator}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (e) => <Badge variant={CATEGORY_VARIANT[e.category]}>{e.category}</Badge>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
          <CalendarDays className="size-3.5 text-subtle" />
          {formatDate(e.date)}
        </span>
      ),
    },
    {
      key: "venue",
      header: "Venue",
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <MapPin className="size-3.5 shrink-0 text-subtle" />
          {e.venue}
        </span>
      ),
    },
    {
      key: "participants",
      header: "Participants",
      sortable: true,
      render: (e) => {
        const pct = Math.min(100, Math.round((e.participants / Math.max(1, e.capacity)) * 100));
        return (
          <div className="min-w-28">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-text">{e.participants}</span>
              <span className="text-subtle">of {e.capacity}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={
                  pct >= 90 ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-primary"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "registration",
      header: "Registration",
      sortable: true,
      render: (e) => (
        <Badge variant={REGISTRATION_VARIANT[e.registration]} className="capitalize">
          {e.registration.replace("-", " ")}
        </Badge>
      ),
    },
    {
      key: "mediaCount",
      header: "Media",
      align: "right",
      sortable: true,
      render: (e) =>
        e.mediaCount > 0 ? (
          <Tooltip content={`${e.mediaCount} photos & videos in the gallery`}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
              <Images className="size-3.5 text-subtle" />
              {e.mediaCount}
            </span>
          </Tooltip>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (e) => (
        <Badge variant={STATUS_VARIANT[e.status]} className="capitalize">
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
            onClick={() => openEdit(e)}
            aria-label={`Edit ${e.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(e)}
            aria-label={`Delete ${e.name}`}
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
        title="Events"
        description="Plan and track annual day, sports day and inter-school competitions."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export schedule
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Create event
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming events" value={stats.upcoming} icon={CalendarDays} tone="indigo" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Total participants" value={stats.participants} icon={Users} tone="violet" />
        <StatCard label="Media uploaded" value={stats.media} icon={Images} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by event, venue or coordinator…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search events"
          />
        </div>
        <div className="w-44">
          <Select
            value={category}
            onChange={(e) => applyFilter(setCategory)(e.target.value)}
            placeholder="All categories"
            options={EVENT_CATEGORY_OPTIONS}
            aria-label="Filter by category"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={EVENT_STATUS_OPTIONS}
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
            rowKey={(e) => e.id}
            loading={loading}
            rowClassName={(e) => (e.status === "cancelled" ? "opacity-60" : undefined)}
            emptyTitle="No events found"
            emptyDescription={
              search || category || status
                ? "Try clearing your filters to see more results."
                : "Create your first event to get started."
            }
            emptyAction={
              search || category || status ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="size-4" />
                  Create event
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

      <p className="flex items-center gap-1.5 text-xs text-subtle">
        <Trophy className="size-3.5" />
        Winners and certificates are published within 48 hours of each competition.
      </p>

      <EventFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete event?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed from the school calendar. This cannot be undone.`
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
