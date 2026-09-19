"use client";

import { useMemo, useState } from "react";
import { BookOpen, Building2, Library, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { subjectsApi, type SchoolSubject } from "@/lib/api/subjects";
import type { SubjectSchema } from "@/lib/schemas/subject";
import { SubjectFormModal } from "./SubjectFormModal";

export default function SubjectsPage() {
  const [search, setSearch] = useState("");

  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    subjectsApi,
    filters,
    { label: "subject", describe: (s) => s.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolSubject | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SchoolSubject | null>(null);

  const stats = useMemo(
    () => ({
      subjects: items.length,
      departments: new Set(items.map((s) => s.department).filter(Boolean)).size,
      coded: items.filter((s) => s.code).length,
    }),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: SubjectSchema) => {
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

  const columns: Column<SchoolSubject>[] = [
    {
      key: "name",
      header: "Subject",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md gradient-indigo text-xs font-semibold text-white">
            {s.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            {s.code ? <p className="truncate text-xs text-subtle">{s.code}</p> : null}
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (s) => (s.code ? <Badge variant="info">{s.code}</Badge> : <span className="text-subtle">—</span>),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      render: (s) => <span className="whitespace-nowrap text-muted">{s.department || "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(s);
              setFormOpen(true);
            }}
            aria-label={`Edit ${s.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(s)}
            aria-label={`Delete ${s.name}`}
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
        title="Subjects"
        description="Manage the subjects offered across the school."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add subject
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Subjects" value={stats.subjects} icon={BookOpen} tone="indigo" />
        <StatCard label="Departments" value={stats.departments} icon={Building2} tone="violet" />
        <StatCard label="With codes" value={stats.coded} icon={Library} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, code or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search subjects"
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
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No subjects found"
          emptyDescription={
            search
              ? "Try clearing your search to see more results."
              : "Add your first subject to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add subject
            </Button>
          }
        />
      )}

      <SubjectFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete subject?"
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
