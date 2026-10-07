"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Search, Plus, Download, FileText, Eye, Pencil, Trash2, Phone, Mail, Users, User,
  UserRound, ShieldCheck, GraduationCap,
} from "lucide-react";
import {
  Avatar, Badge, Button, Card, CardContent, ConfirmDialog, Input, PageHeader, Select,
  StatCard, Table, useToast, type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { exportTablePdf } from "@/lib/exportPdf";
import { useAsyncList } from "@/hooks/useAsyncList";
import {
  parentApi, getParentDirectory, RELATION_OPTIONS,
  type ParentDirectoryEntry, type ParentRelation, type Parent,
} from "@/lib/api/parent";
import type { ParentSchema } from "@/lib/schemas/parent";
import { DetailModal } from "@/components/DetailModal";
import { ParentFormModal } from "./ParentFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const RELATION_VARIANT: Record<string, BadgeVariant> = {
  Father: "info",
  Mother: "success",
  Guardian: "default",
};

export default function ParentsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState("All");

  // The directory is auto-derived from students (+ manual records), so it is
  // never empty when the school has students. reloadKey forces a refetch after edits.
  const [reloadKey, setReloadKey] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetcher = useCallback(() => getParentDirectory(), [reloadKey]);
  const { items, loading, error } = useAsyncList<ParentDirectoryEntry>(fetcher);
  const refetch = () => setReloadKey((k) => k + 1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [viewing, setViewing] = useState<ParentDirectoryEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ParentDirectoryEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (p) =>
        (relationFilter === "All" || p.relation === relationFilter) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q))
    );
  }, [items, relationFilter, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      fathers: items.filter((p) => p.relation === "Father").length,
      mothers: items.filter((p) => p.relation === "Mother").length,
      guardians: items.filter((p) => p.relation === "Guardian").length,
    }),
    [items]
  );

  const handleExport = () => {
    if (visible.length === 0) {
      toast({ title: "Nothing to export", description: "No parents match the current filters.", variant: "warning" });
      return;
    }
    exportToCsv<ParentDirectoryEntry>(
      "parents",
      [
        { header: "Name", value: (p) => p.name },
        { header: "Relation", value: (p) => p.relation },
        { header: "Phone", value: (p) => p.phone },
        { header: "Email", value: (p) => p.email },
        { header: "Occupation", value: (p) => p.occupation },
        { header: "Address", value: (p) => p.address },
        { header: "Children", value: (p) => p.children.map((c) => c.name).join("; ") },
        { header: "Source", value: (p) => (p.source === "manual" ? "Manual" : "From students") },
      ],
      visible
    );
    toast({ title: "Export ready", description: `${visible.length} parent${visible.length === 1 ? "" : "s"} exported to CSV.` });
  };

  const handleExportPdf = () => {
    if (visible.length === 0) {
      toast({ title: "Nothing to export", description: "No parents match the current filters.", variant: "warning" });
      return;
    }
    const parts = [relationFilter !== "All" ? relationFilter : "", search ? `“${search}”` : ""].filter(Boolean);
    const ok = exportTablePdf({
      title: "Parents & Guardians",
      subtitle: parts.length ? `Filtered by ${parts.join(" · ")}` : "All parents & guardians",
      columns: ["Name", "Relation", "Phone", "Email", "Children"],
      rows: visible.map((p) => [p.name, p.relation, p.phone, p.email, p.childCount]),
    });
    if (!ok) {
      toast({ title: "Pop-up blocked", description: "Allow pop-ups for this site to export a PDF.", variant: "error" });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: ParentDirectoryEntry) => {
    // Only manual records are editable. Build the form's Parent shape from the row.
    setEditing({
      id: p.id,
      name: p.name,
      relation: (p.relation as ParentRelation) ?? "Guardian",
      phone: p.phone,
      email: p.email,
      occupation: p.occupation,
      address: p.address,
      students: p.students,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (values: ParentSchema) => {
    try {
      setSaving(true);
      if (editing) await parentApi.update(editing.id, values);
      else await parentApi.create(values);
      toast({ title: editing ? "Parent updated" : "Parent added", description: values.name, variant: "success" });
      setFormOpen(false);
      setEditing(null);
      refetch();
    } catch (e) {
      toast({ title: "Could not save parent", description: e instanceof Error ? e.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleting(true);
      await parentApi.remove(pendingDelete.id);
      toast({ title: "Parent removed", description: pendingDelete.name, variant: "success" });
      setPendingDelete(null);
      refetch();
    } catch (e) {
      toast({ title: "Could not delete parent", description: e instanceof Error ? e.message : "Try again.", variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<ParentDirectoryEntry>[] = [
    {
      key: "name",
      header: "Parent / Guardian",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium text-text">
              {p.name}
              {p.source === "student" && (
                <Badge variant="outline" className="shrink-0">
                  Auto
                </Badge>
              )}
            </p>
            <p className="truncate text-xs text-subtle">{p.occupation || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "relation",
      header: "Relation",
      sortable: true,
      render: (p) => <Badge variant={RELATION_VARIANT[p.relation] ?? "default"}>{p.relation}</Badge>,
    },
    {
      key: "children",
      header: "Children",
      render: (p) =>
        p.childCount === 0 ? (
          <span className="text-xs text-subtle">—</span>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-text">
              <GraduationCap className="size-3.5 text-subtle" />
              {p.childCount} linked
            </span>
            <span className="max-w-48 truncate text-xs text-muted">
              {p.children.map((c) => c.name).join(", ")}
            </span>
          </div>
        ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (p) => (
        <div className="flex flex-col gap-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3 text-subtle" />
            {p.phone || "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="size-3 text-subtle" />
            {p.email || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewing(p)}
            aria-label={`View ${p.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          {p.source === "manual" ? (
            <>
              <button
                onClick={() => openEdit(p)}
                aria-label={`Edit ${p.name}`}
                className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => setPendingDelete(p)}
                aria-label={`Delete ${p.name}`}
                className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          ) : (
            <span className="px-1.5 text-[11px] text-subtle" title="Edit this contact on the student record">
              from student
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Parents & Guardians"
        description="Contacts auto-compiled from your students, plus any you add manually."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handleExportPdf}>
              <FileText className="size-4" />
              Export PDF
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add Parent
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Parents"
          value={error ? "—" : stats.total}
          icon={Users}
          tone="cyan"
          active={relationFilter === "All"}
          onClick={() => setRelationFilter("All")}
        />
        <StatCard
          label="Fathers"
          value={error ? "—" : stats.fathers}
          icon={User}
          tone="indigo"
          active={relationFilter === "Father"}
          onClick={() => setRelationFilter(relationFilter === "Father" ? "All" : "Father")}
        />
        <StatCard
          label="Mothers"
          value={error ? "—" : stats.mothers}
          icon={UserRound}
          tone="rose"
          active={relationFilter === "Mother"}
          onClick={() => setRelationFilter(relationFilter === "Mother" ? "All" : "Mother")}
        />
        <StatCard
          label="Guardians"
          value={error ? "—" : stats.guardians}
          icon={ShieldCheck}
          tone="violet"
          active={relationFilter === "Guardian"}
          onClick={() => setRelationFilter(relationFilter === "Guardian" ? "All" : "Guardian")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search parents"
          />
        </div>
        <div className="w-48">
          <Select
            value={relationFilter}
            onChange={(e) => setRelationFilter(e.target.value)}
            options={[{ label: "All Relations", value: "All" }, ...RELATION_OPTIONS]}
            aria-label="Filter by relation"
          />
        </div>
        <p className="ml-auto text-xs text-subtle">{visible.length} parents</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger">Could not load the parents directory.</p>
            <Button variant="outline" onClick={refetch}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={visible}
          rowKey={(p) => p.id}
          loading={loading}
          pageSize={20}
          emptyTitle="No parents found"
          emptyDescription="Add students (with guardian details) and they appear here automatically, or add a parent manually."
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add Parent
            </Button>
          }
        />
      )}

      <ParentFormModal
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        record={editing}
        existing={items}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.name ?? "Parent"}
        description={viewing ? `${viewing.relation}${viewing.occupation ? ` · ${viewing.occupation}` : ""}` : ""}
        rows={
          viewing
            ? [
                { label: "Name", value: viewing.name },
                { label: "Relation", value: viewing.relation },
                { label: "Phone", value: viewing.phone || "—" },
                { label: "Email", value: viewing.email || "—" },
                { label: "Occupation", value: viewing.occupation || "—" },
                { label: "Address", value: viewing.address || "—", full: true },
                { label: "Source", value: viewing.source === "manual" ? "Added manually" : "Auto-derived from student records" },
                {
                  label: `Children (${viewing.childCount})`,
                  full: true,
                  value:
                    viewing.childCount > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {viewing.children.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center gap-3 rounded-md border border-border bg-surface-sunken px-3 py-2"
                          >
                            <Avatar name={c.name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-text">{c.name}</p>
                              <p className="truncate text-xs text-subtle">
                                {c.className}
                                {c.section ? ` · Section ${c.section}` : ""}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No children linked"
                    ),
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete parent?"
        description={
          pendingDelete
            ? `${pendingDelete.name} (${pendingDelete.relation}) will be permanently removed. This cannot be undone.`
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
