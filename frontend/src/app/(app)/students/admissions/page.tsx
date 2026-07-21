"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
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
  admissionsApi,
  CLASS_APPLIED_OPTIONS,
  nextStage,
  PIPELINE,
  SOURCE_OPTIONS,
  STAGE_META,
  STAGE_OPTIONS,
  type Application,
} from "@/lib/api/admissions";
import type { AdmissionSchema } from "@/lib/schemas/admission";
import { cn } from "@/lib/utils";
import { AdmissionFormModal } from "./AdmissionFormModal";

const PAGE_SIZE = 10;

export default function AdmissionsPage() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [classApplied, setClassApplied] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);

  // `stage` is deliberately left out of the server filters: the funnel needs
  // per-stage counts across the whole (otherwise filtered) set, so the stage
  // narrowing is applied during render instead.
  const filters = useMemo(
    () => ({ search, classApplied, source }),
    [search, classApplied, source]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    admissionsApi,
    filters,
    { label: "application", describe: (a) => a.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null);
  const { toast } = useToast();

  // Narrowing a filter can strand you past the last page, so reset on change.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const staged = useMemo(
    () => (stage ? items.filter((a) => a.stage === stage) : items),
    [items, stage]
  );

  const stats = useMemo(() => {
    const countOf = (s: string) => items.filter((a) => a.stage === s).length;
    const approved = countOf("approved");
    return {
      total: items.length,
      approved,
      inProcess: countOf("applied") + countOf("interview"),
      conversion: items.length ? Math.round((approved / items.length) * 100) : 0,
      byStage: Object.fromEntries(PIPELINE.map((s) => [s, countOf(s)])) as Record<string, number>,
    };
  }, [items]);

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(staged.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = staged.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /** Exports the whole filtered funnel, not just the visible page. */
  const handleExport = () => {
    if (staged.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No applications match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Application>(
      "admissions",
      [
        { header: "Application No", value: (a) => a.applicationNo },
        { header: "Applicant", value: (a) => a.name },
        { header: "Class Applied", value: (a) => a.classApplied },
        { header: "Parent / Guardian", value: (a) => a.parent },
        { header: "Phone", value: (a) => a.phone },
        { header: "Source", value: (a) => a.source },
        { header: "Applied On", value: (a) => a.appliedOn },
        { header: "Entrance Score", value: (a) => (a.score > 0 ? a.score : "") },
        { header: "Stage", value: (a) => STAGE_META[a.stage]?.label ?? a.stage },
        { header: "Notes", value: (a) => a.notes },
      ],
      staged
    );
    toast({
      title: "Export ready",
      description: `${staged.length} application${staged.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: AdmissionSchema) => {
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

  /** Moves an application one step down the funnel. */
  const advance = async (a: Application) => {
    const next = nextStage(a.stage);
    if (!next) return;
    await save({ ...a, stage: next }, a);
  };

  const columns: Column<Application>[] = [
    {
      key: "name",
      header: "Applicant",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{a.name}</p>
            <p className="truncate text-xs text-subtle">{a.applicationNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: "classApplied",
      header: "Class Applied",
      sortable: true,
      render: (a) => <Badge variant="info">{a.classApplied}</Badge>,
    },
    {
      key: "parent",
      header: "Parent / Guardian",
      sortable: true,
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate text-text">{a.parent}</p>
          <p className="flex items-center gap-1 text-xs text-subtle">
            <Phone className="size-3" />
            {a.phone}
          </p>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.source}</span>,
    },
    {
      key: "appliedOn",
      header: "Applied On",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.appliedOn}</span>,
    },
    {
      key: "score",
      header: "Entrance",
      sortable: true,
      align: "right",
      render: (a) =>
        a.score > 0 ? (
          <span
            className={cn(
              "font-semibold",
              a.score >= 75 ? "text-success" : a.score >= 50 ? "text-warning" : "text-danger"
            )}
          >
            {a.score}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      render: (a) => {
        const meta = STAGE_META[a.stage];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => {
        const next = nextStage(a.stage);
        return (
          <div className="flex items-center justify-end gap-1">
            {next && (
              <Tooltip content={`Advance to ${STAGE_META[next].label}`} side="left">
                <button
                  onClick={() => advance(a)}
                  disabled={saving}
                  aria-label={`Advance ${a.name} to ${STAGE_META[next].label}`}
                  className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-success-soft hover:text-success disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </Tooltip>
            )}
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
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Admissions Pipeline"
        description="Track every applicant from first enquiry through to approval."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New Application
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Applications" value={stats.total} icon={Users} tone="indigo" />
        <StatCard label="In Process" value={stats.inProcess} icon={UserPlus} tone="amber" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="emerald" />
        <StatCard
          label="Conversion Rate"
          value={stats.conversion}
          suffix="%"
          icon={CalendarDays}
          tone="violet"
        />
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PIPELINE.map((s) => {
            const count = stats.byStage[s] ?? 0;
            const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
            return (
              <button
                key={s}
                onClick={() => applyFilter(setStage)(stage === s ? "" : s)}
                aria-pressed={stage === s}
                className={cn(
                  "focus-ring rounded-md border p-3 text-left transition-colors",
                  stage === s
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface-sunken hover:bg-surface-hover"
                )}
              >
                <p className="text-xs font-medium text-muted">{STAGE_META[s].label}</p>
                <p className="mt-1 text-2xl font-semibold text-text">{count}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by applicant, application ID or parent…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search applications"
          />
        </div>
        <div className="w-40">
          <Select
            value={stage}
            onChange={(e) => applyFilter(setStage)(e.target.value)}
            placeholder="All stages"
            options={STAGE_OPTIONS}
            aria-label="Filter by stage"
          />
        </div>
        <div className="w-40">
          <Select
            value={classApplied}
            onChange={(e) => applyFilter(setClassApplied)(e.target.value)}
            placeholder="All classes"
            options={CLASS_APPLIED_OPTIONS.map((c) => ({ label: c, value: c }))}
            aria-label="Filter by class applied"
          />
        </div>
        <div className="w-40">
          <Select
            value={source}
            onChange={(e) => applyFilter(setSource)(e.target.value)}
            placeholder="All sources"
            options={SOURCE_OPTIONS.map((s) => ({ label: s, value: s }))}
            aria-label="Filter by source"
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
            rowKey={(a) => a.id}
            loading={loading}
            rowClassName={(a) => (a.stage === "rejected" ? "opacity-60" : undefined)}
            emptyTitle="No applications found"
            emptyDescription={
              search || stage || classApplied || source
                ? "Try clearing your filters to see more results."
                : "Register your first application to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                New Application
              </Button>
            }
          />

          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={staged.length}
            onPageChange={setPage}
          />
        </>
      )}

      <AdmissionFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete application?"
        description={
          pendingDelete
            ? `${pendingDelete.name} (${pendingDelete.applicationNo}) will be permanently removed. This cannot be undone.`
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
