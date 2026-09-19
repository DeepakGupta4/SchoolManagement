"use client";

import { useMemo, useState } from "react";
import { BookOpen, Building2, Check, Eye, Library, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
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
  useToast,
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { subjectsApi, suggestSubjectCode, type SchoolSubject } from "@/lib/api/subjects";
import type { SubjectSchema } from "@/lib/schemas/subject";
import { DetailModal } from "@/components/DetailModal";
import { SubjectFormModal } from "./SubjectFormModal";

// Common subjects offered by most Indian schools — shown as a quick-pick strip
// so an admin can add several at once instead of typing each one.
const COMMON_SUBJECTS = [
  "English", "Hindi", "Mathematics", "Science", "Social Science", "EVS",
  "Physics", "Chemistry", "Biology", "Computer Science", "Physical Education",
  "Sanskrit", "Art & Craft", "Music", "General Knowledge", "Moral Science",
  "Economics", "Accountancy", "Business Studies", "Geography", "History",
  "Political Science",
];

/** Chip styling for the quick-add strip: added (locked), picked, or default. */
function cnChip(added: boolean, picked: boolean): string {
  const base =
    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-ring disabled:cursor-default";
  if (added) return `${base} border-success/30 bg-success-soft text-success-text`;
  if (picked) return `${base} border-primary bg-primary-soft text-primary-text`;
  return `${base} border-border bg-surface text-muted hover:border-border-strong hover:text-text`;
}

export default function SubjectsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    subjectsApi,
    filters,
    { label: "subject", describe: (s) => s.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolSubject | null>(null);
  const [viewing, setViewing] = useState<SchoolSubject | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SchoolSubject | null>(null);

  // Quick-add: which already-suggested subjects exist, and which are picked.
  const present = useMemo(
    () => new Set(items.map((s) => s.name.trim().toLowerCase())),
    [items]
  );
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const togglePick = (name: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const addPicked = async () => {
    const toAdd = [...picked].filter((n) => !present.has(n.toLowerCase()));
    if (toAdd.length === 0) return;
    setBulkSaving(true);
    try {
      for (const name of toAdd) {
        await subjectsApi.create({ name, code: suggestSubjectCode(name), department: "", type: "Core" });
      }
      toast({
        title: `${toAdd.length} subject${toAdd.length === 1 ? "" : "s"} added`,
        description: toAdd.join(", "),
      });
      setPicked(new Set());
      refetch();
    } catch (e) {
      toast({
        title: "Could not add subjects",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBulkSaving(false);
    }
  };

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
      key: "type",
      header: "Type",
      sortable: true,
      render: (s) =>
        s.type ? (
          <Badge variant={s.type === "Core" ? "info" : "default"}>{s.type}</Badge>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewing(s)}
            aria-label={`View ${s.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
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

      {/* Quick-add common subjects — a scrollable pick strip */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-sm font-semibold text-text">Quick add common subjects</p>
            </div>
            <Button size="sm" onClick={addPicked} disabled={bulkSaving || picked.size === 0}>
              <Plus className="size-4" />
              {bulkSaving ? "Adding…" : `Add ${picked.size || ""}`.trim()}
            </Button>
          </div>
          <p className="text-xs text-muted">
            Tap the ones your school offers, then Add. Need something else? Use{" "}
            <span className="font-medium text-text">Add subject</span> for a custom one.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {COMMON_SUBJECTS.map((name) => {
              const added = present.has(name.toLowerCase());
              const isPicked = picked.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  disabled={added}
                  onClick={() => togglePick(name)}
                  aria-pressed={isPicked}
                  className={cnChip(added, isPicked)}
                >
                  {added ? <Check className="size-3.5" /> : isPicked ? <Check className="size-3.5" /> : null}
                  {name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

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

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.name ?? "Subject"}
        description={viewing?.code || ""}
        rows={
          viewing
            ? [
                { label: "Subject", value: viewing.name },
                { label: "Code", value: viewing.code || "—" },
                { label: "Department", value: viewing.department || "—" },
                { label: "Type", value: viewing.type || "—" },
              ]
            : []
        }
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
