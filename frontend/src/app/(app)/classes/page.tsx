"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Layers, Pencil, Plus, School, Search, Trash2, Users } from "lucide-react";
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
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { classesApi, STREAM_OPTIONS, type SchoolClass } from "@/lib/api/classes";
import type { SchoolClassSchema } from "@/lib/schemas/schoolClass";
import { ClassFormModal } from "./ClassFormModal";

export default function ClassesPage() {
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
  const [pendingDelete, setPendingDelete] = useState<SchoolClass | null>(null);

  const stats = useMemo(
    () => ({
      classes: items.length,
      sections: items.reduce((sum, c) => sum + c.sections.length, 0),
      students: items.reduce((sum, c) => sum + c.students, 0),
      teachers: items.reduce((sum, c) => sum + c.teachers, 0),
    }),
    [items]
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
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
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
    { key: "students", header: "Students", sortable: true, align: "right" },
    { key: "teachers", header: "Teachers", sortable: true, align: "right" },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
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
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete class?"
        description={
          pendingDelete
            ? `${pendingDelete.name} and its ${pendingDelete.sections.length} section(s) will be permanently removed. This cannot be undone.`
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
