"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileText,
  HardDrive,
  Library,
  NotebookPen,
  Pencil,
  Search,
  Trash2,
  Upload,
  Video,
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
  Tooltip,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  CLASS_OPTIONS,
  studyMaterialApi,
  SUBJECT_OPTIONS,
  TYPE_OPTIONS,
  type Material,
} from "@/lib/api/studyMaterial";
import type { MaterialSchema } from "@/lib/schemas/material";
import { MaterialFormModal } from "./MaterialFormModal";

const PAGE_SIZE = 10;

const TYPE_META: Record<
  string,
  { label: string; icon: typeof FileText; variant: "danger" | "info" | "warning"; tile: string }
> = {
  pdf: { label: "PDF", icon: FileText, variant: "danger", tile: "gradient-rose" },
  video: { label: "Video", icon: Video, variant: "info", tile: "gradient-cyan" },
  notes: { label: "Notes", icon: NotebookPen, variant: "warning", tile: "gradient-amber" },
};

const FALLBACK_TYPE = {
  label: "File",
  icon: FileText,
  variant: "info" as const,
  tile: "gradient-indigo",
};

const formatSize = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`);

export default function StudyMaterialPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [klass, setKlass] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ search, type, subject, klass }),
    [search, type, subject, klass]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    studyMaterialApi,
    filters,
    { label: "material", describe: (m) => m.title }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Material | null>(null);
  const { toast } = useToast();

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const stats = useMemo(() => {
    const storage = items.reduce((sum, m) => sum + m.sizeMb, 0);
    return {
      files: items.length,
      downloads: items.reduce((sum, m) => sum + m.downloads, 0),
      videos: items.filter((m) => m.type === "video").length,
      storage: (storage / 1024).toFixed(2),
    };
  }, [items]);

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /**
   * Exports the material index across every page of results. The button used to
   * read "Bulk download" but there are no file blobs to bundle, so it exports
   * the catalogue instead and is labelled to match.
   */
  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No study material matches the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Material>(
      "study-material",
      [
        { header: "Title", value: (m) => m.title },
        { header: "Type", value: (m) => m.type },
        { header: "Subject", value: (m) => m.subject },
        { header: "Class", value: (m) => m.klass },
        { header: "Uploaded By", value: (m) => m.uploader },
        { header: "Uploaded", value: (m) => m.uploaded },
        { header: "Size (MB)", value: (m) => m.sizeMb },
        { header: "Downloads", value: (m) => m.downloads },
        { header: "Visibility", value: (m) => m.visibility },
        { header: "Tags", value: (m) => m.tags.join(" / ") },
        { header: "Description", value: (m) => m.description },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} material record${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: MaterialSchema) => {
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

  const columns: Column<Material>[] = [
    {
      key: "title",
      header: "Material",
      sortable: true,
      render: (m) => {
        const meta = TYPE_META[m.type] ?? FALLBACK_TYPE;
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-md text-white ${meta.tile}`}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{m.title}</p>
              <p className="truncate text-xs text-subtle">{formatSize(m.sizeMb)}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (m) => {
        const meta = TYPE_META[m.type] ?? FALLBACK_TYPE;
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (m) => <span className="whitespace-nowrap text-muted">{m.subject}</span>,
    },
    {
      key: "klass",
      header: "Class",
      sortable: true,
      render: (m) => (
        <span className="inline-flex items-center rounded-sm border border-border bg-surface-sunken px-1.5 py-0.5 text-xs font-medium text-muted">
          {m.klass}
        </span>
      ),
    },
    {
      key: "uploader",
      header: "Uploaded by",
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={m.uploader} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-text">{m.uploader}</p>
            <p className="truncate text-xs text-subtle">{m.uploaded}</p>
          </div>
        </div>
      ),
    },
    {
      key: "downloads",
      header: "Downloads",
      sortable: true,
      align: "right",
      render: (m) => <span className="font-medium text-text">{m.downloads}</span>,
    },
    {
      key: "visibility",
      header: "Visibility",
      sortable: true,
      render: (m) => (
        <Badge variant={m.visibility === "published" ? "success" : "default"} className="capitalize">
          {m.visibility}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip content={`Download ${m.title}`} side="left">
            <button
              aria-label={`Download ${m.title}`}
              className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Download className="size-4" />
            </button>
          </Tooltip>
          <button
            onClick={() => {
              setEditing(m);
              setFormOpen(true);
            }}
            aria-label={`Edit ${m.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(m)}
            aria-label={`Delete ${m.title}`}
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
        title="Study material"
        description="Shared library of PDFs, recorded lectures and class notes."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button onClick={openCreate}>
              <Upload className="size-4" />
              Upload material
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Files in library" value={stats.files} icon={Library} tone="indigo" />
        <StatCard
          label="Total downloads"
          value={stats.downloads}
          icon={Download}
          tone="emerald"
          trend={14}
        />
        <StatCard label="Video lectures" value={stats.videos} icon={Video} tone="cyan" />
        <StatCard
          label="Storage used"
          value={stats.storage}
          suffix=" GB"
          icon={HardDrive}
          tone="violet"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by title, subject or uploader…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search study material"
          />
        </div>
        <div className="w-40">
          <Select
            value={type}
            onChange={(e) => applyFilter(setType)(e.target.value)}
            placeholder="All types"
            options={TYPE_OPTIONS}
            aria-label="Filter by type"
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
        <div className="w-40">
          <Select
            value={klass}
            onChange={(e) => applyFilter(setKlass)(e.target.value)}
            placeholder="All classes"
            options={CLASS_OPTIONS.map((c) => ({ label: `Class ${c}`, value: c }))}
            aria-label="Filter by class"
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
            rowKey={(m) => m.id}
            loading={loading}
            rowClassName={(m) => (m.visibility === "draft" ? "opacity-70" : undefined)}
            emptyTitle="No material found"
            emptyDescription={
              search || type || subject || klass
                ? "Try clearing your filters to see more results."
                : "Upload your first resource to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Upload className="size-4" />
                Upload material
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

      <MaterialFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete material?"
        description={
          pendingDelete
            ? `${pendingDelete.title} will be permanently removed from the library. This cannot be undone.`
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
