"use client";

import React, { useMemo, useState } from "react";
import {
  Apple,
  Bell,
  Download,
  GraduationCap,
  Rocket,
  ShieldCheck,
  Smartphone,
  Star,
  UserCog,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";

const APPS = [
  {
    id: "student",
    name: "Campus Student",
    audience: "Students",
    description: "Timetable, homework, results and library dues in one place.",
    version: "4.2.1",
    platforms: ["Android", "iOS"],
    installs: 12480,
    rating: 4.6,
    reviews: 2140,
    crashFree: 99.4,
    status: "Live",
    variant: "success" as const,
    gradient: "gradient-indigo",
    icon: GraduationCap,
    updated: "18 Jul 2026",
  },
  {
    id: "parent",
    name: "Campus Parent",
    audience: "Parents",
    description: "Attendance alerts, fee payments and PTM booking.",
    version: "4.2.0",
    platforms: ["Android", "iOS"],
    installs: 18960,
    rating: 4.4,
    reviews: 3820,
    crashFree: 99.1,
    status: "Live",
    variant: "success" as const,
    gradient: "gradient-emerald",
    icon: Users,
    updated: "16 Jul 2026",
  },
  {
    id: "teacher",
    name: "Campus Teacher",
    audience: "Teachers",
    description: "Roll call, marks entry, lesson plans and leave requests.",
    version: "3.9.4",
    platforms: ["Android", "iOS", "iPad"],
    installs: 640,
    rating: 4.7,
    reviews: 214,
    crashFree: 99.8,
    status: "Live",
    variant: "success" as const,
    gradient: "gradient-violet",
    icon: Smartphone,
    updated: "12 Jul 2026",
  },
  {
    id: "admin",
    name: "Campus Admin",
    audience: "Administrators",
    description: "Approvals, fee dashboards and gate-pass verification on the move.",
    version: "2.4.0",
    platforms: ["Android"],
    installs: 96,
    rating: 4.2,
    reviews: 38,
    crashFree: 98.6,
    status: "Beta",
    variant: "warning" as const,
    gradient: "gradient-amber",
    icon: UserCog,
    updated: "20 Jul 2026",
  },
];

const RELEASES = [
  { id: "RL-24", app: "Campus Admin",   version: "2.4.0", platform: "Android",     channel: "Beta",       date: "20 Jul 2026", size: "18.4 MB", notes: "Gate-pass QR verification and offline approval queue." },
  { id: "RL-23", app: "Campus Student", version: "4.2.1", platform: "Android/iOS", channel: "Production", date: "18 Jul 2026", size: "26.1 MB", notes: "Fixed timetable crash on period swaps; faster result loading." },
  { id: "RL-22", app: "Campus Parent",  version: "4.2.0", platform: "Android/iOS", channel: "Production", date: "16 Jul 2026", size: "24.8 MB", notes: "UPI autopay for term fees and Hindi language support." },
  { id: "RL-21", app: "Campus Teacher", version: "3.9.4", platform: "Android/iOS", channel: "Production", date: "12 Jul 2026", size: "21.3 MB", notes: "Bulk marks entry from CSV and offline roll call sync." },
  { id: "RL-20", app: "Campus Student", version: "4.2.0", platform: "Android/iOS", channel: "Production", date: "05 Jul 2026", size: "25.9 MB", notes: "New assignment submission flow with photo upload." },
  { id: "RL-19", app: "Campus Parent",  version: "4.1.6", platform: "Android",     channel: "Staged 20%", date: "28 Jun 2026", size: "24.2 MB", notes: "Bus live-tracking map and delay push notifications." },
  { id: "RL-18", app: "Campus Admin",   version: "2.3.2", platform: "Android",     channel: "Beta",       date: "22 Jun 2026", size: "17.9 MB", notes: "Fee collection widget and leave approval shortcuts." },
  { id: "RL-17", app: "Campus Teacher", version: "3.9.0", platform: "iPad",        channel: "Production", date: "14 Jun 2026", size: "22.6 MB", notes: "Split-view lesson planner for iPad." },
];

type Release = (typeof RELEASES)[number];

const CHANNEL_VARIANT: Record<string, "default" | "success" | "warning" | "info"> = {
  Production: "success",
  Beta: "warning",
  "Staged 20%": "info",
};

const PLATFORM_VARIANT: Record<string, "default" | "success" | "info"> = {
  Android: "success",
  iOS: "info",
  iPad: "default",
};

export default function MobilePage() {
  const { toast } = useToast();

  const [appFilter, setAppFilter] = useState("");

  const totalInstalls = APPS.reduce((sum, a) => sum + a.installs, 0);
  const avgRating = (APPS.reduce((s, a) => s + a.rating, 0) / APPS.length).toFixed(1);
  const avgCrashFree = (APPS.reduce((s, a) => s + a.crashFree, 0) / APPS.length).toFixed(1);

  const filteredReleases = useMemo(
    () => (appFilter ? RELEASES.filter((r) => r.app === appFilter) : RELEASES),
    [appFilter]
  );

  const columns: Column<Release>[] = [
    {
      key: "app",
      header: "App",
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{r.app}</p>
          <p className="truncate text-xs text-subtle">v{r.version}</p>
        </div>
      ),
    },
    {
      key: "platform",
      header: "Platform",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.platform.split("/").map((p) => (
            <Badge key={p} variant={PLATFORM_VARIANT[p] ?? "default"}>
              {p}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      sortable: true,
      render: (r) => <Badge variant={CHANNEL_VARIANT[r.channel] ?? "default"}>{r.channel}</Badge>,
    },
    {
      key: "notes",
      header: "Release notes",
      render: (r) => <span className="text-muted">{r.notes}</span>,
    },
    {
      key: "size",
      header: "Size",
      align: "right",
      render: (r) => <span className="whitespace-nowrap text-subtle">{r.size}</span>,
    },
    {
      key: "date",
      header: "Released",
      sortable: true,
      align: "right",
      render: (r) => <span className="whitespace-nowrap text-muted">{r.date}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Mobile Apps"
        description="Student, parent, teacher and admin apps — versions, adoption and releases."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Release notes exported",
                  description: `${filteredReleases.length} releases queued as PDF.`,
                  variant: "info",
                })
              }
            >
              <Download className="size-4" />
              Export notes
            </Button>
            <Button
              onClick={() =>
                toast({
                  title: "Update push scheduled",
                  description: "All devices will be prompted to update at 8 PM tonight.",
                  variant: "success",
                })
              }
            >
              <Rocket className="size-4" />
              Push update
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total installs" value={totalInstalls.toLocaleString("en-IN")} icon={Download} tone="indigo" trend={9} />
        <StatCard label="Average rating" value={avgRating} suffix=" / 5" icon={Star} tone="amber" />
        <StatCard label="Crash-free sessions" value={avgCrashFree} suffix="%" icon={ShieldCheck} tone="emerald" />
        <StatCard label="Apps published" value={APPS.length} icon={Smartphone} tone="cyan" sub="1 in beta" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {APPS.map((app) => {
          const Icon = app.icon;
          return (
            <Card key={app.id} className="card-hover">
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-sm ${app.gradient}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <Badge variant={app.variant}>{app.status}</Badge>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{app.name}</p>
                  <p className="mt-0.5 text-xs text-subtle">
                    v{app.version} · {app.audience}
                  </p>
                  <p className="mt-1.5 text-xs text-muted">{app.description}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {app.platforms.map((p) => (
                    <Badge key={p} variant={PLATFORM_VARIANT[p] ?? "default"}>
                      {p === "iOS" || p === "iPad" ? (
                        <Apple className="mr-1 size-3" />
                      ) : (
                        <Smartphone className="mr-1 size-3" />
                      )}
                      {p}
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {app.installs.toLocaleString("en-IN")} installs
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-text">
                      <Star className="size-3.5 fill-warning text-warning" />
                      {app.rating}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                    {/* Width is genuinely data-driven. */}
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${app.crashFree}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-subtle">
                    <span>{app.crashFree}% crash-free</span>
                    <span>{app.reviews.toLocaleString("en-IN")} reviews</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      toast({
                        title: `${app.name} update notified`,
                        description: `Prompt sent to ${app.installs.toLocaleString("en-IN")} devices on v${app.version}.`,
                        variant: "success",
                      })
                    }
                  >
                    <Bell className="size-3.5" />
                    Notify users
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Release notes</h2>
            <p className="mt-0.5 text-xs text-muted">
              Every build shipped to the Play Store and App Store this quarter.
            </p>
          </div>
          <div className="w-52">
            <Select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              placeholder="All apps"
              options={APPS.map((a) => ({ label: a.name, value: a.name }))}
              aria-label="Filter releases by app"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            rows={filteredReleases}
            rowKey={(r) => r.id}
            rowClassName={(r) => (r.channel === "Beta" ? "bg-warning-soft" : undefined)}
            emptyTitle="No releases found"
            emptyDescription="Clear the app filter to see the full release history."
          />
        </CardContent>
      </Card>
    </div>
  );
}
