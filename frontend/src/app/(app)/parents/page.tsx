"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Users,
  User,
  UserRound,
  ShieldCheck,
  GraduationCap,
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
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import { parentApi, RELATION_OPTIONS, type Parent } from "@/lib/api/parent";
import type { ParentSchema } from "@/lib/schemas/parent";
import { listStudents } from "@/lib/api/students";
import { fullName, type Student } from "@/types/student";
import { DetailModal } from "@/components/DetailModal";
import { ParentFormModal } from "./ParentFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

/** Relations map onto the semantic badge palette — no per-relation hexes. */
const RELATION_VARIANT: Record<string, BadgeVariant> = {
  Father: "info",
  Mother: "success",
  Guardian: "default",
};

export default function ParentsPage() {
  const [search, setSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState("All");

  // Only `search` narrows server-side. `relation` is applied during render so
  // the stat cards keep reporting across the whole roster — filtering it out
  // server-side would make every card that counts a relation you just filtered
  // away read zero.
  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    parentApi,
    filters,
    { label: "parent", describe: (p) => p.name }
  );

  // Student roster, resolved once so the table's "Children" column and the
  // detail view can show each linked child's live name, class and roll/adm no.
  const [roster, setRoster] = useState<Student[]>([]);
  useEffect(() => {
    let cancelled = false;
    listStudents()
      .then((all) => !cancelled && setRoster(all))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const studentById = useMemo(() => {
    const map = new Map<string, Student>();
    roster.forEach((s) => map.set(s.id, s));
    return map;
  }, [roster]);

  const childrenOf = (p: Parent): Student[] =>
    p.students.map((id) => studentById.get(id)).filter((s): s is Student => Boolean(s));

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [viewing, setViewing] = useState<Parent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Parent | null>(null);
  const { toast } = useToast();

  // Rows for the table only — stat cards keep counting the full `items`.
  const visible = useMemo(
    () => items.filter((p) => relationFilter === "All" || p.relation === relationFilter),
    [items, relationFilter]
  );

  const stats = useMemo(
    () => ({
      total: items.length,
      fathers: items.filter((p) => p.relation === "Father").length,
      mothers: items.filter((p) => p.relation === "Mother").length,
      guardians: items.filter((p) => p.relation === "Guardian").length,
    }),
    [items]
  );

  /** Exports exactly the rows the table is showing, filters included. */
  const handleExport = () => {
    if (visible.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No parents match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Parent>(
      "parents",
      [
        { header: "Name", value: (p) => p.name },
        { header: "Relation", value: (p) => p.relation },
        { header: "Phone", value: (p) => p.phone },
        { header: "Email", value: (p) => p.email },
        { header: "Occupation", value: (p) => p.occupation },
        { header: "Address", value: (p) => p.address },
        { header: "Children", value: (p) => childrenOf(p).map(fullName).join("; ") },
      ],
      visible
    );
    toast({
      title: "Export ready",
      description: `${visible.length} parent${visible.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ParentSchema) => {
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

  const columns: Column<Parent>[] = [
    {
      key: "name",
      header: "Parent / Guardian",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{p.name}</p>
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
      render: (p) => {
        const kids = childrenOf(p);
        if (kids.length === 0) return <span className="text-xs text-subtle">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-text">
              <GraduationCap className="size-3.5 text-subtle" />
              {kids.length} linked
            </span>
            <span className="max-w-48 truncate text-xs text-muted">
              {kids.map(fullName).join(", ")}
            </span>
          </div>
        );
      },
    },
    {
      key: "contact",
      header: "Contact",
      render: (p) => (
        <div className="flex flex-col gap-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3 text-subtle" />
            {p.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="size-3 text-subtle" />
            {p.email}
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
          <button
            onClick={() => {
              setEditing(p);
              setFormOpen(true);
            }}
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
        </div>
      ),
    },
  ];

  const viewingChildren = viewing ? childrenOf(viewing) : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Parents & Guardians"
        description="Manage parent contacts and the students in their care"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
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
          value={stats.total}
          icon={Users}
          tone="cyan"
          active={relationFilter === "All"}
          onClick={() => setRelationFilter("All")}
        />
        <StatCard
          label="Fathers"
          value={stats.fathers}
          icon={User}
          tone="indigo"
          active={relationFilter === "Father"}
          onClick={() => setRelationFilter(relationFilter === "Father" ? "All" : "Father")}
        />
        <StatCard
          label="Mothers"
          value={stats.mothers}
          icon={UserRound}
          tone="rose"
          active={relationFilter === "Mother"}
          onClick={() => setRelationFilter(relationFilter === "Mother" ? "All" : "Mother")}
        />
        <StatCard
          label="Guardians"
          value={stats.guardians}
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
            options={[
              { label: "All Relations", value: "All" },
              ...RELATION_OPTIONS,
            ]}
            aria-label="Filter by relation"
          />
        </div>
        <p className="ml-auto text-xs text-subtle">{visible.length} parents</p>
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
          rows={visible}
          rowKey={(p) => p.id}
          loading={loading}
          emptyTitle="No parents found"
          emptyDescription="Try adjusting your search, or add a parent to get started."
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
        description={
          viewing
            ? `${viewing.relation}${viewing.occupation ? ` · ${viewing.occupation}` : ""}`
            : ""
        }
        footer={
          viewing ? (
            <Button
              variant="outline"
              onClick={() => {
                const p = viewing;
                setViewing(null);
                setEditing(p);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          ) : undefined
        }
        rows={
          viewing
            ? [
                { label: "Name", value: viewing.name },
                { label: "Relation", value: viewing.relation },
                { label: "Phone", value: viewing.phone },
                { label: "Email", value: viewing.email },
                { label: "Occupation", value: viewing.occupation },
                { label: "Address", value: viewing.address, full: true },
                {
                  label: `Children (${viewingChildren.length})`,
                  full: true,
                  value:
                    viewingChildren.length > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {viewingChildren.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center gap-3 rounded-md border border-border bg-surface-sunken px-3 py-2"
                          >
                            <Avatar name={fullName(c)} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-text">{fullName(c)}</p>
                              <p className="truncate text-xs text-subtle">
                                {c.className} · Section {c.section} · Roll {c.rollNo} ·{" "}
                                {c.admissionNo}
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
