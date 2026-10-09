"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, GraduationCap, Layers, Pencil, Plus, School, Search, Trash2, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { classesApi, STREAM_OPTIONS, type SchoolClass } from "@/lib/api/classes";
import { fetchAllStudents } from "@/lib/api/students";
import { fetchAllTeachers } from "@/lib/api/teachers";
import type { Student } from "@/types/student";
import type { Teacher } from "@/types/teacher";
import type { SchoolClassSchema } from "@/lib/schemas/schoolClass";
import { DetailModal } from "@/components/DetailModal";
import { ClassFormModal } from "./ClassFormModal";

/**
 * Class names are matched by value across collections (a class row vs a student's
 * `className` vs a teacher's `classes[]`), and those come from different inputs, so
 * normalise before comparing — otherwise "Class 6", "class 6" and "Class  6" (double
 * space) would each miss and show a class as having zero students.
 */
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export default function ClassesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [stream, setStream] = useState("");

  const filters = useMemo(() => ({ search, stream }), [search, stream]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    classesApi,
    filters,
    { label: "class", describe: (c) => c.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [viewing, setViewing] = useState<SchoolClass | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SchoolClass | null>(null);

  // Live rosters so student/teacher counts are DERIVED, never typed. Fetched in
  // FULL (not the 200-cap list) so counts are correct at any school size, and
  // refetched only after a class mutation (rosterKey bump) — a rename cascades to
  // students' className on the server, so the counts must refresh — never on every
  // search keystroke (which is what keying this on `items` used to do).
  const [roster, setRoster] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [rosterKey, setRosterKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAllStudents(), fetchAllTeachers()])
      .then(([s, t]) => {
        if (cancelled) return;
        setRoster(s);
        setStaff(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [rosterKey]);

  const studentCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of roster) {
      const k = norm(s.className);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [roster]);

  const teacherCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of staff) for (const c of t.classes) {
      const k = norm(c);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [staff]);

  // Active enrollment for the class pending deletion — drives the warning + the
  // client-side guard (the server also blocks it, but this avoids a doomed call).
  const pendingActiveStudents = useMemo(
    () =>
      pendingDelete
        ? roster.filter((s) => norm(s.className) === norm(pendingDelete.name) && s.status === "active").length
        : 0,
    [pendingDelete, roster]
  );

  const stats = useMemo(
    () => ({
      classes: items.length,
      sections: items.reduce((sum, c) => sum + c.sections.length, 0),
      students: roster.length,
      teachers: staff.length,
    }),
    [items, roster, staff]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: SchoolClassSchema) => {
    const ok = await save(values, editing);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
      setRosterKey((k) => k + 1); // a rename cascades to student classNames — refresh counts
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    // Don't attempt a delete the server will reject — a class with active students
    // can't be removed (they'd be orphaned). Guide the admin to reassign first.
    if (pendingActiveStudents > 0) {
      toast({
        title: "Class still has students",
        description: `${pendingDelete.name} has ${pendingActiveStudents} active student(s). Move or transfer them to another class first.`,
        variant: "warning",
      });
      return;
    }
    const ok = await remove(pendingDelete);
    if (ok) {
      setPendingDelete(null);
      setRosterKey((k) => k + 1); // delete scrubbed the class off teacher records — refresh
    }
  };

  const columns: Column<SchoolClass>[] = [
    {
      key: "name",
      header: "Class",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md gradient-indigo text-xs font-semibold text-white">
            {c.name.replace(/\D/g, "") || "–"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{c.name}</p>
            <p className="truncate text-xs text-subtle">Room {c.room}</p>
          </div>
        </div>
      ),
    },
    {
      key: "sections",
      header: "Sections",
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.sections.map((s) => (
            <Badge key={s} variant="info">
              {s}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "stream",
      header: "Stream",
      sortable: true,
      render: (c) => <span className="whitespace-nowrap text-muted">{c.stream}</span>,
    },
    {
      key: "classTeacher",
      header: "Class teacher",
      sortable: true,
      render: (c) => <span className="whitespace-nowrap text-muted">{c.classTeacher}</span>,
    },
    {
      key: "students",
      header: "Students",
      sortable: true,
      align: "right",
      sortValue: (c) => studentCount.get(norm(c.name)) ?? 0,
      render: (c) => <span className="text-muted">{studentCount.get(norm(c.name)) ?? 0}</span>,
    },
    {
      key: "teachers",
      header: "Teachers",
      sortable: true,
      align: "right",
      sortValue: (c) => teacherCount.get(norm(c.name)) ?? 0,
      render: (c) => <span className="text-muted">{teacherCount.get(norm(c.name)) ?? 0}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewing(c)}
            aria-label={`View ${c.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditing(c);
              setFormOpen(true);
            }}
            aria-label={`Edit ${c.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(c)}
            aria-label={`Delete ${c.name}`}
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
        title="Classes & Sections"
        description="Manage classes, sections and class-teacher assignments."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add class
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Classes" value={stats.classes} icon={School} tone="indigo" />
        <StatCard label="Sections" value={stats.sections} icon={Layers} tone="violet" />
        <StatCard label="Students" value={stats.students} icon={GraduationCap} tone="emerald" />
        <StatCard label="Teachers" value={stats.teachers} icon={Users} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by class, teacher or room…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search classes"
          />
        </div>
        <div className="w-52">
          <Select
            value={stream}
            onChange={(e) => setStream(e.target.value)}
            placeholder="All streams"
            options={STREAM_OPTIONS.map((s) => ({ label: s, value: s }))}
            aria-label="Filter by stream"
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
          rows={items}
          rowKey={(c) => c.id}
          loading={loading}
          emptyTitle="No classes found"
          emptyDescription={
            search || stream
              ? "Try clearing your filters to see more results."
              : "Add your first class to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add class
            </Button>
          }
        />
      )}

      <ClassFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        existing={items}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.name ?? "Class"}
        description={viewing ? `Room ${viewing.room}` : ""}
        rows={
          viewing
            ? [
                { label: "Class", value: viewing.name },
                { label: "Room", value: viewing.room },
                { label: "Stream", value: viewing.stream },
                { label: "Class teacher", value: viewing.classTeacher || "—" },
                { label: "Students", value: studentCount.get(norm(viewing.name)) ?? 0 },
                { label: "Teachers", value: teacherCount.get(norm(viewing.name)) ?? 0 },
                {
                  label: "Sections",
                  value: viewing.sections.length ? viewing.sections.join(", ") : "—",
                  full: true,
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete class?"
        description={
          pendingDelete
            ? pendingActiveStudents > 0
              ? `${pendingDelete.name} still has ${pendingActiveStudents} active student(s). Move or transfer them to another class first — deletion is blocked while students are enrolled.`
              : `${pendingDelete.name} and its ${pendingDelete.sections.length} section(s) will be permanently removed. This cannot be undone.`
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
