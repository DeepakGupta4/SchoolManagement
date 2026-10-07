"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, Plus, Download, Pencil, Trash2, Users, UserCheck, CalendarClock, Briefcase } from "lucide-react";
import {
  Avatar, Badge, Button, Card, CardContent, ConfirmDialog, Input, PageHeader, Select, StatCard,
  Table, useToast, type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import { useAsyncList } from "@/hooks/useAsyncList";
import {
  applicationsApi, APPLICATION_STAGES, STAGE_LABEL, type Application, type ApplicationStage,
} from "@/lib/api/applications";
import { jobPostingsApi, type JobPosting } from "@/lib/api/jobPostings";
import type { ApplicationSchema } from "@/lib/schemas/application";
import { ApplicationFormModal } from "./ApplicationFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
const STAGE_VARIANT: Record<string, BadgeVariant> = {
  applied: "info",
  shortlisted: "warning",
  interview: "default",
  hired: "success",
  rejected: "danger",
};

export default function ApplicantsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [postingFilter, setPostingFilter] = useState("All");

  // `stage` stays client-side so the tiles count every stage within the posting.
  const filters = useMemo(
    () => ({ search, jobCode: postingFilter === "All" ? "" : postingFilter, limit: 500 }),
    [search, postingFilter]
  );
  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    applicationsApi,
    filters,
    { label: "applicant", describe: (a) => a.name }
  );

  const postingsFetcher = useCallback(() => jobPostingsApi.list({ limit: 500 }), []);
  const { items: postings } = useAsyncList<JobPosting>(postingsFetcher);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null);
  const [stageSaving, setStageSaving] = useState<string | null>(null);

  const visible = useMemo(
    () => items.filter((a) => stageFilter === "All" || a.stage === stageFilter),
    [items, stageFilter]
  );

  const count = (st: string) => items.filter((a) => a.stage === st).length;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ApplicationSchema) => {
    // Coalesce the optional schema fields into a complete record for save().
    const ok = await save(
      {
        jobCode: values.jobCode ?? "",
        jobTitle: values.jobTitle ?? "",
        name: values.name,
        email: values.email ?? "",
        phone: values.phone ?? "",
        experience: values.experience ?? "",
        appliedOn: values.appliedOn ?? "",
        stage: values.stage,
        note: values.note ?? "",
      },
      editing
    );
    if (ok) {
      setFormOpen(false);
      setEditing(null);
    }
  };

  const changeStage = async (a: Application, stage: ApplicationStage) => {
    try {
      setStageSaving(a.id);
      await applicationsApi.update(a.id, { stage });
      toast({ title: `Moved to ${STAGE_LABEL[stage]}`, description: a.name, variant: "success" });
      refetch();
    } catch {
      toast({ title: "Couldn't update stage", description: "Please try again.", variant: "error" });
    } finally {
      setStageSaving(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
  };

  const handleExport = () => {
    if (visible.length === 0) {
      toast({ title: "Nothing to export", description: "No applicants match the current filters.", variant: "warning" });
      return;
    }
    exportToCsv<Application>(
      "applicants",
      [
        { header: "Name", value: (a) => a.name },
        { header: "Applied For", value: (a) => a.jobTitle || a.jobCode },
        { header: "Email", value: (a) => a.email },
        { header: "Phone", value: (a) => a.phone },
        { header: "Experience", value: (a) => a.experience },
        { header: "Applied On", value: (a) => a.appliedOn },
        { header: "Stage", value: (a) => STAGE_LABEL[a.stage] ?? a.stage },
      ],
      visible
    );
    toast({ title: "Export ready", description: `${visible.length} applicant${visible.length === 1 ? "" : "s"} exported to CSV.` });
  };

  const columns: Column<Application>[] = [
    {
      key: "name",
      header: "Candidate",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{a.name}</p>
            <p className="truncate text-xs text-subtle">{a.email || a.phone || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "jobTitle",
      header: "Applied For",
      sortable: true,
      render: (a) => <span className="text-muted">{a.jobTitle || a.jobCode || "—"}</span>,
    },
    { key: "experience", header: "Experience", render: (a) => <span className="text-muted">{a.experience || "—"}</span> },
    { key: "appliedOn", header: "Applied On", render: (a) => <span className="text-muted">{a.appliedOn || "—"}</span> },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-2">
          <Badge variant={STAGE_VARIANT[a.stage] ?? "default"}>{STAGE_LABEL[a.stage] ?? a.stage}</Badge>
          <div className="w-32">
            <Select
              value={a.stage}
              disabled={stageSaving === a.id}
              onChange={(e) => changeStage(a, e.target.value as ApplicationStage)}
              options={APPLICATION_STAGES.map((s) => ({ label: STAGE_LABEL[s], value: s }))}
              aria-label={`Change stage for ${a.name}`}
            />
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(a);
              setFormOpen(true);
            }}
            aria-label={`Edit ${a.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(a)}
            aria-label={`Delete ${a.name}`}
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
        title="Applicants"
        description="Track candidates through the hiring pipeline."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add Applicant
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Applicants" value={error ? "—" : items.length} icon={Users} tone="indigo" />
        <StatCard
          label="Shortlisted"
          value={error ? "—" : count("shortlisted")}
          icon={UserCheck}
          tone="amber"
          active={stageFilter === "shortlisted"}
          onClick={() => setStageFilter(stageFilter === "shortlisted" ? "All" : "shortlisted")}
        />
        <StatCard
          label="Interview"
          value={error ? "—" : count("interview")}
          icon={CalendarClock}
          tone="violet"
          active={stageFilter === "interview"}
          onClick={() => setStageFilter(stageFilter === "interview" ? "All" : "interview")}
        />
        <StatCard
          label="Hired"
          value={error ? "—" : count("hired")}
          icon={Briefcase}
          tone="emerald"
          active={stageFilter === "hired"}
          onClick={() => setStageFilter(stageFilter === "hired" ? "All" : "hired")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search applicants"
          />
        </div>
        <div className="w-56">
          <Select
            value={postingFilter}
            onChange={(e) => setPostingFilter(e.target.value)}
            options={[
              { label: "All postings", value: "All" },
              ...postings.map((p) => ({ label: `${p.title} · ${p.code}`, value: p.code })),
            ]}
            aria-label="Filter by posting"
          />
        </div>
        <div className="w-44">
          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            options={[
              { label: "All stages", value: "All" },
              ...APPLICATION_STAGES.map((s) => ({ label: STAGE_LABEL[s], value: s })),
            ]}
            aria-label="Filter by stage"
          />
        </div>
        <p className="ml-auto text-xs text-subtle">{visible.length} applicants</p>
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
          rowKey={(a) => a.id}
          loading={loading}
          pageSize={15}
          emptyTitle="No applicants yet"
          emptyDescription="Add a candidate, or post a job first."
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add Applicant
            </Button>
          }
        />
      )}

      <ApplicationFormModal
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        record={editing}
        postings={postings}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete applicant?"
        description={
          pendingDelete ? `${pendingDelete.name}'s application will be permanently removed. This cannot be undone.` : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
