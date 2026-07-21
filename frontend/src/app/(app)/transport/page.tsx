"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  MapPin,
  Users,
  Bus,
  Route as RouteIcon,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";
import { useResource } from "@/hooks/useResource";
import { busRoutesApi, type BusRoute } from "@/lib/api/busRoutes";
import type { BusRouteSchema } from "@/lib/schemas/busRoute";
import { BusRouteFormModal } from "./BusRouteFormModal";

const recentAlerts = [
  { route: "Route E — Laxmi Nagar", msg: "Bus delayed by 15 mins due to traffic", time: "8:05 AM", type: "warning" },
  { route: "Route A — Dwarka",      msg: "Bus arrived on time",                   time: "8:15 AM", type: "success" },
  { route: "Route G — Gurgaon",     msg: "Bus departed — 52 students on board",   time: "6:45 AM", type: "info"    },
  { route: "Route D — Pitampura",   msg: "Minor breakdown — backup arranged",     time: "7:30 AM", type: "error"   },
];

const statusConfig: Record<
  string,
  { variant: "success" | "warning" | "default"; icon: LucideIcon; label: string }
> = {
  active:   { variant: "success", icon: CheckCircle, label: "Active"   },
  delayed:  { variant: "warning", icon: Clock,       label: "Delayed"  },
  inactive: { variant: "default", icon: AlertCircle, label: "Inactive" },
};

const fallbackStatus = { variant: "default" as const, icon: AlertCircle, label: "Unknown" };

/** Alert feed dot colour, keyed by the feed item's semantic type. */
const alertDot: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-primary",
  error: "bg-danger",
};

/** Each route gets a stable tile/stripe gradient from the shared token set. */
const routeGradients = [
  "gradient-indigo",
  "gradient-emerald",
  "gradient-amber",
  "gradient-rose",
  "gradient-cyan",
  "gradient-violet",
];

/** Stable per-route gradient derived from its code, so it survives re-ordering. */
const gradientFor = (code: string) => {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return routeGradients[hash % routeGradients.length];
};

/** Occupancy thresholds map onto the semantic status tokens. */
function occupancyTone(pct: number) {
  if (pct >= 90) return { bar: "bg-danger", text: "text-danger" };
  if (pct >= 70) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
}

function RowActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="px-2"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="px-2 hover:bg-danger-soft hover:text-danger"
        onClick={onDelete}
        aria-label={`Delete ${label}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export default function TransportPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState<"grid" | "table">("grid");

  // `statusFilter` is deliberately left out of the server filters: the stat
  // cards and today's summary need per-status counts across the whole
  // (otherwise filtered) set, so status narrowing is applied during render.
  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    busRoutesApi,
    filters,
    { label: "route", describe: (r) => r.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BusRoute | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BusRoute | null>(null);
  const { toast } = useToast();

  // Rows for the grid/table only — stat cards keep counting the full `items`.
  const visible = useMemo(
    () => (statusFilter === "All" ? items : items.filter((r) => r.status === statusFilter)),
    [items, statusFilter]
  );

  const stats = useMemo(
    () => ({
      routes: items.length,
      // A bus can serve more than one route, so count distinct vehicles rather
      // than reusing the route total.
      buses: new Set(items.map((r) => r.bus)).size,
      active: items.filter((r) => r.status === "active").length,
      delayed: items.filter((r) => r.status === "delayed").length,
      inactive: items.filter((r) => r.status === "inactive").length,
      students: items.reduce((sum, r) => sum + r.students, 0),
    }),
    [items]
  );

  /** Exports exactly the routes on screen — same set in grid and table view. */
  const handleExport = () => {
    if (visible.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No routes match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<BusRoute>(
      "bus-routes",
      [
        { header: "Route Code", value: (r) => r.code },
        { header: "Route", value: (r) => r.name },
        { header: "Bus No.", value: (r) => r.bus },
        { header: "Driver", value: (r) => r.driver },
        { header: "Stops", value: (r) => r.stops.length },
        { header: "Stop Names", value: (r) => r.stops.join("; ") },
        { header: "Departure", value: (r) => r.departure },
        { header: "Arrival", value: (r) => r.arrival },
        { header: "Students", value: (r) => r.students },
        { header: "Capacity", value: (r) => r.capacity },
        {
          header: "Occupancy (%)",
          value: (r) => (r.capacity ? Math.round((r.students / r.capacity) * 100) : 0),
        },
        { header: "Distance", value: (r) => r.distance },
        { header: "Status", value: (r) => (statusConfig[r.status] ?? fallbackStatus).label },
      ],
      visible
    );
    toast({
      title: "Export ready",
      description: `${visible.length} route${visible.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (route: BusRoute) => {
    setEditing(route);
    setFormOpen(true);
  };

  const handleSubmit = async (values: BusRouteSchema) => {
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

  const columns: Column<BusRoute>[] = [
    {
      key: "name",
      header: "Route",
      sortable: true,
      render: (route) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md text-white",
              gradientFor(route.code)
            )}
          >
            <Bus className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{route.name}</p>
            <p className="truncate text-xs text-subtle">{route.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "bus",
      header: "Bus No.",
      render: (route) => <span className="whitespace-nowrap font-mono text-xs text-muted">{route.bus}</span>,
    },
    {
      key: "driver",
      header: "Driver",
      sortable: true,
      render: (route) => <span className="whitespace-nowrap text-muted">{route.driver}</span>,
    },
    {
      key: "stops",
      header: "Stops",
      align: "right",
      render: (route) => <span className="text-muted">{route.stops.length}</span>,
    },
    {
      key: "departure",
      header: "Departure",
      render: (route) => <span className="whitespace-nowrap text-muted">{route.departure}</span>,
    },
    {
      key: "arrival",
      header: "Arrival",
      render: (route) => <span className="whitespace-nowrap text-muted">{route.arrival}</span>,
    },
    {
      key: "students",
      header: "Students",
      sortable: true,
      render: (route) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
          <Users className="size-3.5 text-subtle" />
          {route.students}/{route.capacity}
        </span>
      ),
    },
    {
      key: "distance",
      header: "Distance",
      render: (route) => <span className="whitespace-nowrap text-muted">{route.distance}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (route) => {
        const sc = statusConfig[route.status] ?? fallbackStatus;
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1">
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
      render: (route) => (
        <div className="flex justify-end">
          <RowActions
            label={route.name}
            onEdit={() => openEdit(route)}
            onDelete={() => setPendingDelete(route)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Transport"
        description="Manage bus routes, drivers and student transport."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add route
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total routes" value={stats.routes} icon={RouteIcon} tone="indigo" />
        <StatCard label="Active routes" value={stats.active} icon={Bus} tone="emerald" />
        <StatCard label="Students using bus" value={stats.students} icon={GraduationCap} tone="amber" />
        <StatCard label="Total buses" value={stats.buses} icon={Bus} tone="violet" />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3">
              <div className="min-w-60 flex-1">
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search routes, drivers…"
                  icon={<Search className="size-4" />}
                  aria-label="Search routes"
                />
              </div>
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                  options={[
                    { label: "All status", value: "All" },
                    { label: "Active", value: "active" },
                    { label: "Delayed", value: "delayed" },
                    { label: "Inactive", value: "inactive" },
                  ]}
                />
              </div>
              <div className="ml-auto inline-flex gap-1 rounded-md bg-surface-sunken p-1">
                {(["grid", "table"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                      view === v
                        ? "bg-surface-raised text-text shadow-sm"
                        : "text-muted hover:text-text"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {error ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm font-medium text-danger">{error}</p>
                <Button variant="outline" onClick={refetch}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {loading && visible.length === 0 ? (
                <Card className="lg:col-span-2">
                  <CardContent className="py-12 text-center text-sm text-muted">
                    Loading routes…
                  </CardContent>
                </Card>
              ) : visible.length === 0 ? (
                <Card className="lg:col-span-2">
                  <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <p className="text-sm font-medium text-text">No routes found</p>
                    <p className="text-xs text-muted">
                      Try adjusting your search or status filter.
                    </p>
                    <Button variant="outline" onClick={openCreate}>
                      <Plus className="size-4" />
                      Add route
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                visible.map((route) => {
                  const sc = statusConfig[route.status] ?? fallbackStatus;
                  const StatusIcon = sc.icon;
                  const occupancy = route.capacity
                    ? Math.round((route.students / route.capacity) * 100)
                    : 0;
                  const tone = occupancyTone(occupancy);
                  const gradient = gradientFor(route.code);
                  return (
                    <Card key={route.id} className="card-hover overflow-hidden">
                      <div className={cn("h-1.5", gradient)} />
                      <CardContent>
                        <div className="mb-3.5 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div
                              className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-md text-white",
                                gradient
                              )}
                            >
                              <Bus className="size-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-text">{route.name}</p>
                              <p className="truncate text-xs text-subtle">
                                {route.code} · {route.distance}
                              </p>
                            </div>
                          </div>
                          <Badge variant={sc.variant} className="shrink-0 gap-1">
                            <StatusIcon className="size-3" />
                            {sc.label}
                          </Badge>
                        </div>

                        <div className="mb-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {[
                            { label: "Driver", value: route.driver },
                            { label: "Bus no.", value: route.bus },
                            { label: "Departure", value: route.departure },
                            { label: "Arrival", value: route.arrival },
                          ].map((info) => (
                            <div key={info.label} className="rounded-sm bg-surface-sunken px-3 py-2">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">
                                {info.label}
                              </p>
                              <p className="mt-0.5 truncate text-xs font-medium text-text">{info.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mb-3.5">
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs text-muted">Occupancy</span>
                            <span className={cn("text-xs font-semibold", tone.text)}>
                              {route.students}/{route.capacity} students ({occupancy}%)
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                            <div
                              className={cn("h-full rounded-full transition-all", tone.bar)}
                              style={{ width: `${occupancy}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                            <MapPin className="size-3.5 text-subtle" />
                            {route.stops.length} stops
                          </span>
                          <RowActions
                            label={route.name}
                            onEdit={() => openEdit(route)}
                            onDelete={() => setPendingDelete(route)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <Table
              columns={columns}
              rows={visible}
              rowKey={(r) => r.id}
              loading={loading}
              emptyTitle="No routes found"
              emptyDescription="Try adjusting your search or status filter."
              emptyAction={
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="size-4" />
                  Add route
                </Button>
              }
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-success" />
                <p className="text-sm font-semibold text-text">Live alerts</p>
              </div>
            </CardHeader>
            <div>
              {recentAlerts.map((alert, i) => (
                <div
                  key={`${alert.route}-${i}`}
                  className="flex items-start gap-2.5 border-b border-border px-5 py-3 last:border-0"
                >
                  <span
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", alertDot[alert.type])}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-text">{alert.route}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{alert.msg}</p>
                    <p className="mt-1 text-[11px] text-subtle">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardContent>
              <p className="mb-3.5 text-sm font-semibold text-text">Today&apos;s summary</p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Routes on time",
                    value: `${stats.active}/${stats.routes}`,
                    tone: "bg-success-soft text-success-text",
                  },
                  { label: "Delayed", value: stats.delayed, tone: "bg-warning-soft text-warning-text" },
                  { label: "Inactive", value: stats.inactive, tone: "bg-surface-hover text-muted" },
                  {
                    label: "Total students",
                    value: stats.students,
                    tone: "bg-primary-soft text-primary-text",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md px-3.5 py-2.5",
                      s.tone
                    )}
                  >
                    <span className="text-xs font-medium">{s.label}</span>
                    <span className="text-base font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BusRouteFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete route?"
        description={
          pendingDelete
            ? `${pendingDelete.name} (${pendingDelete.code}) and its ${pendingDelete.stops.length} stop(s) will be permanently removed. This cannot be undone.`
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
