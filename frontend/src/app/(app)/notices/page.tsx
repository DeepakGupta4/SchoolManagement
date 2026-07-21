"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Pin,
  FileText,
  AlertCircle,
  Info,
  CheckCircle,
  Calendar,
} from "lucide-react";
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
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  NOTICE_AUDIENCE_OPTIONS,
  NOTICE_CATEGORIES,
  NOTICE_PRIORITIES,
  noticesApi,
  type Notice,
} from "@/lib/api/notices";
import type { NoticeSchema } from "@/lib/schemas/notice";
import { NoticeFormModal } from "./NoticeFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const categoryConfig: Record<string, { variant: BadgeVariant; icon: React.ReactNode }> = {
  Exam:      { variant: "warning", icon: <FileText className="size-3" /> },
  Finance:   { variant: "success", icon: <AlertCircle className="size-3" /> },
  Event:     { variant: "info",    icon: <Calendar className="size-3" /> },
  General:   { variant: "outline", icon: <Info className="size-3" /> },
  Holiday:   { variant: "danger",  icon: <CheckCircle className="size-3" /> },
  Meeting:   { variant: "default", icon: <FileText className="size-3" /> },
  Transport: { variant: "info",    icon: <Info className="size-3" /> },
};

const fallbackCategory = { variant: "default" as BadgeVariant, icon: <Info className="size-3" /> };

const priorityVariant: Record<string, BadgeVariant> = {
  High: "danger",
  Medium: "warning",
  Low: "success",
};

/** Dot colour used in the priority legend, one token class per level. */
const priorityDot: Record<string, string> = {
  High: "bg-danger",
  Medium: "bg-warning",
  Low: "bg-success",
};

const audienceVariant: Record<string, BadgeVariant> = {
  Parents: "warning",
  Staff: "default",
  Students: "success",
};

export default function NoticesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const filters = useMemo(
    () => ({
      search,
      category: categoryFilter,
      audience: audienceFilter,
      priority: priorityFilter,
    }),
    [search, categoryFilter, audienceFilter, priorityFilter]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    noticesApi,
    filters,
    { label: "notice", describe: (n) => n.title }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Notice | null>(null);
  const { toast } = useToast();

  const pinned = useMemo(() => items.filter((n) => n.pinned), [items]);

  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No notices match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Notice>(
      "notices",
      [
        { header: "ID", value: (n) => n.id },
        { header: "Title", value: (n) => n.title },
        { header: "Category", value: (n) => n.category },
        { header: "Priority", value: (n) => n.priority },
        { header: "Audience", value: (n) => n.audience.join(" / ") },
        { header: "Posted By", value: (n) => n.postedBy },
        { header: "Date", value: (n) => n.date },
        { header: "Expiry", value: (n) => n.expiry },
        { header: "Pinned", value: (n) => (n.pinned ? "Yes" : "No") },
        { header: "Body", value: (n) => n.body },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} notice${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const stats = useMemo(
    () => ({
      total: items.length,
      pinned: pinned.length,
      high: items.filter((n) => n.priority === "High").length,
      // Distinct categories actually in use, not the size of the option list.
      categories: new Set(items.map((n) => n.category)).size,
    }),
    [items, pinned]
  );

  const hasFilters = Boolean(search || categoryFilter || audienceFilter || priorityFilter);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditing(notice);
    setFormOpen(true);
  };

  const handleSubmit = async (values: NoticeSchema) => {
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

  const columns: Column<Notice>[] = [
    {
      key: "title",
      header: "Notice",
      sortable: true,
      render: (n) => (
        <div className="flex items-start gap-2">
          {n.pinned && <Pin className="mt-0.5 size-3.5 shrink-0 text-warning" />}
          <div className="min-w-0 max-w-64">
            <p className="truncate font-medium text-text">{n.title}</p>
            <p className="mt-0.5 truncate text-xs text-subtle">{n.body}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (n) => {
        const cc = categoryConfig[n.category] ?? fallbackCategory;
        return (
          <Badge variant={cc.variant} className="gap-1">
            {cc.icon} {n.category}
          </Badge>
        );
      },
    },
    {
      key: "audience",
      header: "Audience",
      render: (n) => (
        <div className="flex flex-wrap gap-1">
          {n.audience.map((a) => (
            <Badge key={a} variant={audienceVariant[a] ?? "default"}>
              {a}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "postedBy",
      header: "Posted by",
      sortable: true,
      render: (n) => <span className="whitespace-nowrap text-muted">{n.postedBy}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (n) => <span className="whitespace-nowrap text-muted">{n.date}</span>,
    },
    {
      key: "expiry",
      header: "Expiry",
      sortable: true,
      render: (n) => <span className="whitespace-nowrap text-muted">{n.expiry}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (n) => <Badge variant={priorityVariant[n.priority] ?? "default"}>{n.priority}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (n) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(n)}
            aria-label={`Edit ${n.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Edit className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(n)}
            aria-label={`Delete ${n.title}`}
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
        title="Notice Board"
        description="Post and manage official school notices."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Post notice
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total notices" value={stats.total} icon={FileText} tone="indigo" />
        <StatCard label="Pinned" value={stats.pinned} icon={Pin} tone="amber" />
        <StatCard label="High priority" value={stats.high} icon={AlertCircle} tone="rose" />
        <StatCard label="Categories" value={stats.categories} icon={Info} tone="cyan" />
      </div>

      {pinned.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Pinned
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {pinned.map((n) => {
              const cc = categoryConfig[n.category] ?? fallbackCategory;
              return (
                <Card key={n.id} className="border-warning">
                  <CardContent className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge variant="warning" className="gap-1">
                          <Pin className="size-3" /> Pinned
                        </Badge>
                        <Badge variant={cc.variant} className="gap-1">
                          {cc.icon} {n.category}
                        </Badge>
                        <Badge variant={priorityVariant[n.priority] ?? "default"}>
                          {n.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-text">{n.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                        {n.body}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap gap-1">
                          {n.audience.map((a) => (
                            <Badge key={a} variant={audienceVariant[a] ?? "default"}>
                              {a}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-subtle">Expires: {n.expiry}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        onClick={() => openEdit(n)}
                        aria-label={`Edit ${n.title}`}
                        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(n)}
                        aria-label={`Delete ${n.title}`}
                        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices…"
            icon={<Search className="size-4" />}
            aria-label="Search notices"
          />
        </div>
        <div className="w-44">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            placeholder="All categories"
            options={NOTICE_CATEGORIES.map((c) => ({ label: c, value: c }))}
          />
        </div>
        <div className="w-40">
          <Select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            aria-label="Filter by audience"
            placeholder="All audiences"
            options={NOTICE_AUDIENCE_OPTIONS.map((a) => ({ label: a, value: a }))}
          />
        </div>
        <div className="w-40">
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
            placeholder="All priorities"
            options={NOTICE_PRIORITIES.map((p) => ({ label: p, value: p }))}
          />
        </div>
        <p className="ml-auto text-xs text-subtle">{items.length} notices</p>
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
          rowKey={(n) => n.id}
          loading={loading}
          emptyTitle="No notices found"
          emptyDescription={
            hasFilters
              ? "Try clearing your filters to see more results."
              : "Post your first notice to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Post notice
            </Button>
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Showing <strong className="font-semibold text-text">{items.length}</strong>{" "}
          {hasFilters ? "matching" : ""} notices
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {NOTICE_PRIORITIES.map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${priorityDot[p]}`} />
              <span className="text-xs text-muted">
                {p}:{" "}
                <strong className="font-semibold text-text">
                  {items.filter((n) => n.priority === p).length}
                </strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      <NoticeFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete notice?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed from the notice board. This cannot be undone.`
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
