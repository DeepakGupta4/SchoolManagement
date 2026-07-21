"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  Eye,
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
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const routes = [
  { id: "RT001", name: "Route A — Dwarka",       stops: 8,  students: 42, driver: "Ramesh Kumar",   bus: "DL-01-AB-1234", capacity: 50, departure: "7:00 AM", arrival: "8:15 AM", status: "active",   distance: "18 km" },
  { id: "RT002", name: "Route B — Rohini",        stops: 6,  students: 38, driver: "Suresh Yadav",   bus: "DL-02-CD-5678", capacity: 45, departure: "7:10 AM", arrival: "8:20 AM", status: "active",   distance: "22 km" },
  { id: "RT003", name: "Route C — Janakpuri",     stops: 5,  students: 30, driver: "Mohan Singh",    bus: "DL-03-EF-9012", capacity: 40, departure: "7:05 AM", arrival: "8:10 AM", status: "active",   distance: "14 km" },
  { id: "RT004", name: "Route D — Pitampura",     stops: 7,  students: 44, driver: "Vijay Sharma",   bus: "DL-04-GH-3456", capacity: 50, departure: "7:15 AM", arrival: "8:30 AM", status: "active",   distance: "25 km" },
  { id: "RT005", name: "Route E — Laxmi Nagar",   stops: 9,  students: 35, driver: "Anil Gupta",     bus: "DL-05-IJ-7890", capacity: 45, departure: "7:00 AM", arrival: "8:25 AM", status: "delayed",  distance: "20 km" },
  { id: "RT006", name: "Route F — Noida Sec 62",  stops: 10, students: 48, driver: "Deepak Verma",   bus: "DL-06-KL-2345", capacity: 55, departure: "6:50 AM", arrival: "8:20 AM", status: "active",   distance: "30 km" },
  { id: "RT007", name: "Route G — Gurgaon",       stops: 12, students: 52, driver: "Rajesh Tiwari",  bus: "DL-07-MN-6789", capacity: 55, departure: "6:45 AM", arrival: "8:30 AM", status: "active",   distance: "35 km" },
  { id: "RT008", name: "Route H — Faridabad",     stops: 8,  students: 28, driver: "Sanjay Mishra",  bus: "DL-08-OP-0123", capacity: 40, departure: "6:40 AM", arrival: "8:15 AM", status: "inactive", distance: "28 km" },
];

type RouteRow = (typeof routes)[number];

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

const gradientFor = (id: string) =>
  routeGradients[Math.max(0, routes.findIndex((r) => r.id === id)) % routeGradients.length];

/** Occupancy thresholds map onto the semantic status tokens. */
function occupancyTone(pct: number) {
  if (pct >= 90) return { bar: "bg-danger", text: "text-danger" };
  if (pct >= 70) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
}

function RowActions({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="px-2" aria-label={`View ${label}`}>
        <Eye className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" className="px-2" aria-label={`Edit ${label}`}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="px-2 hover:bg-danger-soft hover:text-danger"
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

  const filtered = routes.filter((r) => {
    const matchStatus = statusFilter === "All" || r.status === statusFilter.toLowerCase();
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.driver.toLowerCase().includes(search.toLowerCase()) ||
      r.bus.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalStudents = routes.reduce((s, r) => s + r.students, 0);
  const activeRoutes = routes.filter((r) => r.status === "active").length;

  const columns: Column<RouteRow>[] = [
    {
      key: "name",
      header: "Route",
      sortable: true,
      render: (route) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md text-white",
              gradientFor(route.id)
            )}
          >
            <Bus className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{route.name}</p>
            <p className="truncate text-xs text-subtle">{route.id}</p>
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
      sortable: true,
      align: "right",
      render: (route) => <span className="text-muted">{route.stops}</span>,
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
        const sc = statusConfig[route.status];
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
          <RowActions label={route.name} />
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
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add route
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total routes" value={routes.length} icon={RouteIcon} tone="indigo" />
        <StatCard label="Active routes" value={activeRoutes} icon={Bus} tone="emerald" />
        <StatCard label="Students using bus" value={totalStudents} icon={GraduationCap} tone="amber" />
        <StatCard label="Total buses" value={routes.length} icon={Bus} tone="violet" />
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

          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((route) => {
                const sc = statusConfig[route.status];
                const StatusIcon = sc.icon;
                const occupancy = Math.round((route.students / route.capacity) * 100);
                const tone = occupancyTone(occupancy);
                const gradient = gradientFor(route.id);
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
                              {route.id} · {route.distance}
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
                          {route.stops} stops
                        </span>
                        <RowActions label={route.name} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Table
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              emptyTitle="No routes found"
              emptyDescription="Try adjusting your search or status filter."
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
                  { label: "Routes on time", value: "6/8", tone: "bg-success-soft text-success-text" },
                  { label: "Delayed", value: "1", tone: "bg-warning-soft text-warning-text" },
                  { label: "Inactive", value: "1", tone: "bg-surface-hover text-muted" },
                  { label: "Total students", value: totalStudents, tone: "bg-primary-soft text-primary-text" },
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
    </div>
  );
}
