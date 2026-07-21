"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Bell,
  Pin,
  Trash2,
  Edit,
  Eye,
  Megaphone,
  Users,
  BookOpen,
  Bus,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatCard,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  ANNOUNCEMENT_CATEGORIES,
  AUDIENCE_OPTIONS,
  announcementsApi,
  formatNoticeDate,
  type Announcement,
} from "@/lib/api/announcements";
import type { AnnouncementSchema } from "@/lib/schemas/announcement";
import { AnnouncementFormModal } from "./AnnouncementFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const categoryConfig: Record<string, { variant: BadgeVariant; icon: React.ReactNode }> = {
  Event:     { variant: "info",    icon: <Megaphone className="size-3" /> },
  Finance:   { variant: "success", icon: <BookOpen className="size-3" /> },
  Meeting:   { variant: "default", icon: <Users className="size-3" /> },
  Exam:      { variant: "warning", icon: <BookOpen className="size-3" /> },
  Notice:    { variant: "outline", icon: <Bell className="size-3" /> },
  Transport: { variant: "info",    icon: <Bus className="size-3" /> },
  Holiday:   { variant: "danger",  icon: <Bell className="size-3" /> },
};

const audienceVariant: Record<string, BadgeVariant> = {
  Students: "success",
  Parents: "warning",
  Staff: "default",
};

const tabs = ["All", "Pinned"] as const;

export default function AnnouncementsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");

  const filters = useMemo(
    () => ({
      search,
      category: categoryFilter,
      audience: audienceFilter,
      pinnedOnly: tab === "Pinned",
    }),
    [search, categoryFilter, audienceFilter, tab]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    announcementsApi,
    filters,
    { label: "announcement", describe: (a) => a.title }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null);
  const { toast } = useToast();

  const stats = useMemo(
    () => ({
      total: items.length,
      pinned: items.filter((a) => a.pinned).length,
      views: items.reduce((sum, a) => sum + a.views, 0),
    }),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: AnnouncementSchema) => {
    const ok = await save(
      { ...values, date: editing?.date ?? formatNoticeDate(new Date()) },
      editing
    );
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

  const hasFilters = Boolean(search || categoryFilter || audienceFilter) || tab === "Pinned";

  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No announcements match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Announcement>(
      "announcements",
      [
        { header: "ID", value: (a) => a.id },
        { header: "Title", value: (a) => a.title },
        { header: "Category", value: (a) => a.category },
        { header: "Audience", value: (a) => a.audience.join(" / ") },
        { header: "Author", value: (a) => a.author },
        { header: "Date", value: (a) => a.date },
        { header: "Pinned", value: (a) => (a.pinned ? "Yes" : "No") },
        { header: "Views", value: (a) => a.views },
        { header: "Body", value: (a) => a.body },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} announcement${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Announcements"
        description="Broadcast notices to students, parents and staff."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New announcement
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={Megaphone} tone="amber" />
        <StatCard label="Pinned" value={stats.pinned} icon={Pin} tone="indigo" />
        <StatCard label="Total views" value={stats.views} icon={Eye} tone="cyan" />
        <StatCard label="Audiences" value={AUDIENCE_OPTIONS.length} icon={Users} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Announcement filter"
          className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface-raised p-1"
        >
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "focus-ring rounded-sm px-4 py-1.5 text-xs font-semibold transition-colors",
                tab === t
                  ? "bg-primary-soft text-primary-text"
                  : "text-muted hover:bg-surface-hover hover:text-text"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            icon={<Search className="size-4" />}
            aria-label="Search announcements"
          />
        </div>

        <div className="w-44">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            placeholder="All categories"
            options={ANNOUNCEMENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
          />
        </div>

        <div className="w-40">
          <Select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            aria-label="Filter by audience"
            placeholder="All audiences"
            options={AUDIENCE_OPTIONS.map((a) => ({ label: a, value: a }))}
          />
        </div>

        <p className="ml-auto text-xs text-subtle">{items.length} announcements</p>
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
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => {
            const cc = categoryConfig[a.category] ?? {
              variant: "default" as BadgeVariant,
              icon: <Bell className="size-3" />,
            };
            return (
              <Card key={a.id} className={cn("card-hover", a.pinned && "border-warning")}>
                <CardContent className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {a.pinned && (
                        <Badge variant="warning" className="gap-1">
                          <Pin className="size-3" /> Pinned
                        </Badge>
                      )}
                      <Badge variant={cc.variant} className="gap-1">
                        {cc.icon} {a.category}
                      </Badge>
                      {a.audience.map((aud) => (
                        <Badge key={aud} variant={audienceVariant[aud] ?? "default"}>
                          {aud}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="text-sm font-semibold text-text">{a.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                      {a.body}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-subtle">
                      <span>
                        By <strong className="font-medium text-text">{a.author}</strong>
                      </span>
                      <span>{a.date}</span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" /> {a.views} views
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(a);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit ${a.title}`}
                      className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      onClick={() => setPendingDelete(a)}
                      aria-label={`Delete ${a.title}`}
                      className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {items.length === 0 && (
            <Card>
              <EmptyState
                icon={<Megaphone className="size-5" />}
                title="No announcements found"
                description={
                  hasFilters
                    ? "Try clearing your filters to see more results."
                    : "Publish your first announcement to get started."
                }
                action={
                  <Button variant="outline" onClick={openCreate}>
                    <Plus className="size-4" />
                    New announcement
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      )}

      <AnnouncementFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete announcement?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed from the feed. This cannot be undone.`
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
