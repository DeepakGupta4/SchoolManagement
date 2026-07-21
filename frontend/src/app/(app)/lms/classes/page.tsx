"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Clock,
  Pencil,
  Plus,
  Radio,
  Search,
  Trash2,
  Users,
  Video,
  VideoOff,
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
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import {
  onlineClassesApi,
  STATE_META,
  STATE_OPTIONS,
  SUBJECT_OPTIONS,
  TEACHER_OPTIONS,
  type OnlineClass,
} from "@/lib/api/onlineClasses";
import type { OnlineClassSchema } from "@/lib/schemas/onlineClass";
import { OnlineClassFormModal } from "./OnlineClassFormModal";

const PAGE_SIZE = 10;

/** Pulsing dot marking a session that is running right now. */
function LiveDot() {
  return (
    <span className="relative flex size-2.5 shrink-0">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
      <span className="relative inline-flex size-2.5 rounded-full bg-success" />
    </span>
  );
}

export default function OnlineClassesPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ search, subject, teacher, state }),
    [search, subject, teacher, state]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    onlineClassesApi,
    filters,
    { label: "class", describe: (c) => c.topic }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OnlineClass | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OnlineClass | null>(null);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const liveClasses = useMemo(() => items.filter((c) => c.state === "live"), [items]);

  const stats = useMemo(
    () => ({
      live: liveClasses.length,
      attendees: liveClasses.reduce((sum, c) => sum + c.attendees, 0),
      scheduled: items.filter((c) => c.state === "scheduled").length,
      recorded: items.filter((c) => c.state === "recorded").length,
    }),
    [items, liveClasses]
  );

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: OnlineClassSchema) => {
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

  const columns: Column<OnlineClass>[] = [
    {
      key: "topic",
      header: "Topic",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.state === "live" ? <LiveDot /> : null}
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{c.topic}</p>
            <p className="truncate text-xs text-subtle">
              {c.subject} · Class {c.klass}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "teacher",
      header: "Teacher",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.teacher} size="sm" />
          <span className="whitespace-nowrap text-muted">{c.teacher}</span>
        </div>
      ),
    },
    {
      key: "when",
      header: "Schedule",
      sortable: true,
      render: (c) => <span className="whitespace-nowrap text-muted">{c.when}</span>,
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      align: "right",
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
          <Clock className="size-3.5 text-subtle" />
          {c.duration} min
        </span>
      ),
    },
    {
      key: "attendees",
      header: "Attendees",
      sortable: true,
      align: "right",
      render: (c) =>
        c.attendees > 0 ? (
          <span className="font-medium text-text">{c.attendees}</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "platform",
      header: "Platform",
      sortable: true,
      render: (c) => <Badge variant="outline">{c.platform}</Badge>,
    },
    {
      key: "state",
      header: "Status",
      sortable: true,
      render: (c) => {
        const meta = STATE_META[c.state];
        return meta ? <Badge variant={meta.variant}>{meta.label}</Badge> : null;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          {c.state === "cancelled" ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
              <VideoOff className="size-3.5" />
              Cancelled
            </span>
          ) : (
            // Scheduled sessions have a link but nothing to join yet, so only
            // live and recorded ones open it.
            <a
              href={c.state === "scheduled" ? undefined : c.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={c.state === "scheduled"}
              onClick={(e) => c.state === "scheduled" && e.preventDefault()}
              title={c.state === "scheduled" ? `Starts ${c.when}` : c.link}
            >
              <Button
                size="sm"
                variant={c.state === "live" ? "primary" : "outline"}
                disabled={c.state === "scheduled"}
              >
                <Video className="size-3.5" />
                {c.state === "live" ? "Join" : c.state === "recorded" ? "Watch" : "Details"}
              </Button>
            </a>
          )}
          <button
            onClick={() => {
              setEditing(c);
              setFormOpen(true);
            }}
            aria-label={`Edit ${c.topic}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(c)}
            aria-label={`Delete ${c.topic}`}
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
        title="Online classes"
        description="Live sessions, upcoming schedule and the recorded lecture archive."
        actions={
          <>
            <Button variant="outline">
              <CalendarClock className="size-4" />
              Timetable
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Schedule class
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live now" value={stats.live} icon={Radio} tone="emerald" />
        <StatCard label="Students in session" value={stats.attendees} icon={Users} tone="indigo" />
        <StatCard label="Scheduled" value={stats.scheduled} icon={CalendarClock} tone="cyan" />
        <StatCard label="Recorded lectures" value={stats.recorded} icon={Video} tone="violet" />
      </div>

      {liveClasses.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LiveDot />
            <h2 className="text-sm font-semibold text-text">Live right now</h2>
            <Badge variant="success">{liveClasses.length} running</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {liveClasses.map((c) => (
              <Card key={c.id} className="border-border-strong">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md gradient-emerald text-white">
                      <Radio className="size-4.5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-success-text">
                      <LiveDot />
                      Live
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{c.topic}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {c.subject} · Class {c.klass} · {c.platform}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.teacher} size="sm" />
                    <span className="truncate text-xs text-muted">{c.teacher}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-subtle" />
                      {c.when}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 text-subtle" />
                      {c.attendees} attending
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="truncate text-xs text-subtle">{c.link}</span>
                    <a
                      href={c.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Join ${c.subject} with ${c.teacher}`}
                    >
                      <Button size="sm">
                        <Video className="size-3.5" />
                        Join
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by topic, subject, teacher or class…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search online classes"
          />
        </div>
        <div className="w-48">
          <Select
            value={subject}
            onChange={(e) => applyFilter(setSubject)(e.target.value)}
            placeholder="All subjects"
            options={SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }))}
            aria-label="Filter by subject"
          />
        </div>
        <div className="w-52">
          <Select
            value={teacher}
            onChange={(e) => applyFilter(setTeacher)(e.target.value)}
            placeholder="All teachers"
            options={TEACHER_OPTIONS.map((t) => ({ label: t, value: t }))}
            aria-label="Filter by teacher"
          />
        </div>
        <div className="w-40">
          <Select
            value={state}
            onChange={(e) => applyFilter(setState)(e.target.value)}
            placeholder="All statuses"
            options={STATE_OPTIONS}
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
            rowKey={(c) => c.id}
            loading={loading}
            rowClassName={(c) => (c.state === "cancelled" ? "opacity-60" : undefined)}
            emptyTitle="No classes found"
            emptyDescription={
              search || subject || teacher || state
                ? "Try clearing your filters to see more results."
                : "Schedule your first class to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                Schedule class
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

      <OnlineClassFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete class?"
        description={
          pendingDelete
            ? `${pendingDelete.topic} (${pendingDelete.subject} · Class ${pendingDelete.klass}) will be permanently removed. This cannot be undone.`
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
