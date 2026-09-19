"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Download, FileText, Library, MonitorPlay, Radio } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { useAsyncList } from "@/hooks/useAsyncList";
import { onlineClassesApi, STATE_META, type OnlineClass } from "@/lib/api/onlineClasses";
import { studyMaterialApi, type Material } from "@/lib/api/studyMaterial";

// Module-scope fetchers stay referentially stable across renders, so
// useAsyncList doesn't refetch on every render.
const fetchClasses = () => onlineClassesApi.list();
const fetchMaterials = () => studyMaterialApi.list();

const RECENT_LIMIT = 5;

export default function LmsOverviewPage() {
  const { items: classes, loading: loadingClasses } = useAsyncList<OnlineClass>(fetchClasses);
  const { items: materials, loading: loadingMaterials } = useAsyncList<Material>(fetchMaterials);

  const stats = useMemo(
    () => ({
      classes: classes.length,
      upcoming: classes.filter((c) => c.state === "scheduled" || c.state === "live").length,
      materials: materials.length,
      downloads: materials.reduce((sum, m) => sum + m.downloads, 0),
    }),
    [classes, materials]
  );

  const recentClasses = useMemo(() => classes.slice(0, RECENT_LIMIT), [classes]);
  const recentMaterials = useMemo(() => materials.slice(0, RECENT_LIMIT), [materials]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Learning Management"
        description="Live classes and shared study material across the school, at a glance."
        actions={
          <>
            <Link href="/lms/classes">
              <Button variant="outline">
                <MonitorPlay className="size-4" />
                Online classes
              </Button>
            </Link>
            <Link href="/lms/material">
              <Button>
                <FileText className="size-4" />
                Study material
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Online classes" value={stats.classes} icon={MonitorPlay} tone="indigo" />
        <StatCard label="Live & upcoming" value={stats.upcoming} icon={Radio} tone="emerald" />
        <StatCard label="Study materials" value={stats.materials} icon={Library} tone="cyan" />
        <StatCard label="Total downloads" value={stats.downloads} icon={Download} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/lms/classes"
          className="focus-ring group rounded-lg outline-none"
          aria-label="Go to online classes"
        >
          <Card className="card-hover h-full">
            <CardContent className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md gradient-indigo text-white">
                <MonitorPlay className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text">Online classes</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  Live, scheduled and recorded sessions
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
        <Link
          href="/lms/material"
          className="focus-ring group rounded-lg outline-none"
          aria-label="Go to study material"
        >
          <Card className="card-hover h-full">
            <CardContent className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md gradient-cyan text-white">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text">Study material</p>
                <p className="mt-0.5 truncate text-xs text-muted">PDFs, videos and class notes</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Recent classes</h2>
            <Link
              href="/lms/classes"
              className="focus-ring rounded-sm text-xs font-medium text-primary-text transition-colors hover:text-primary"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {!loadingClasses && recentClasses.length === 0 ? (
              <EmptyState
                title="No classes yet"
                description="Schedule a session to get started."
                icon={<MonitorPlay className="size-5" />}
                action={
                  <Link href="/lms/classes">
                    <Button variant="outline" size="sm">
                      Schedule class
                    </Button>
                  </Link>
                }
              />
            ) : (
              recentClasses.map((c) => {
                const meta = STATE_META[c.state];
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover"
                  >
                    <Avatar name={c.teacher || c.topic} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{c.topic}</p>
                      <p className="truncate text-xs text-muted">
                        {[c.subject, c.klass && `Class ${c.klass}`, c.when]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {meta ? <Badge variant={meta.variant}>{meta.label}</Badge> : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Recent material</h2>
            <Link
              href="/lms/material"
              className="focus-ring rounded-sm text-xs font-medium text-primary-text transition-colors hover:text-primary"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {!loadingMaterials && recentMaterials.length === 0 ? (
              <EmptyState
                title="No material yet"
                description="Upload a resource to build the library."
                icon={<Library className="size-5" />}
                action={
                  <Link href="/lms/material">
                    <Button variant="outline" size="sm">
                      Upload material
                    </Button>
                  </Link>
                }
              />
            ) : (
              recentMaterials.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{m.title}</p>
                    <p className="truncate text-xs text-muted">
                      {[m.subject, m.klass].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
                    <Download className="size-3.5 text-subtle" />
                    {m.downloads}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
