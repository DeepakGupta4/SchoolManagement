"use client";

import { useMemo, useState } from "react";
import {
  CalendarHeart,
  CircleCheck,
  Eye,
  IndianRupee,
  Pencil,
  Play,
  Plus,
  Repeat,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Workflow as WorkflowIcon,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  PageHeader,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import {
  workflowsApi,
  runAllWorkflows,
  runWorkflow,
  TRIGGER_META,
  type Workflow,
  type WorkflowTrigger,
} from "@/lib/api/workflows";
import type { WorkflowSchema } from "@/lib/schemas/workflow";
import { DetailModal } from "@/components/DetailModal";
import { WorkflowFormModal } from "./WorkflowFormModal";

const TRIGGER_VARIANT: Record<WorkflowTrigger, "info" | "success" | "warning" | "danger"> = {
  attendance_low: "warning",
  fee_overdue: "danger",
  birthday_today: "success",
  admission_pending: "info",
};

// One-click presets. Each installs a ready-to-run rule with sensible defaults.
const TEMPLATES: {
  key: string;
  label: string;
  icon: typeof Zap;
  values: Omit<Workflow, "id" | "runCount" | "lastRunAt">;
}[] = [
  {
    key: "attendance",
    label: "Low attendance alert",
    icon: Zap,
    values: {
      name: "Low attendance alert",
      description: "Flags active students who drop below 75% attendance.",
      trigger: "attendance_low",
      threshold: 75,
      enabled: true,
    },
  },
  {
    key: "fees",
    label: "Fee due reminder",
    icon: IndianRupee,
    values: {
      name: "Fee due reminder",
      description: "Summarises students with pending fees and the total owed.",
      trigger: "fee_overdue",
      threshold: 75,
      enabled: true,
    },
  },
  {
    key: "birthday",
    label: "Birthday greetings",
    icon: CalendarHeart,
    values: {
      name: "Birthday greetings",
      description: "Lists students celebrating a birthday today.",
      trigger: "birthday_today",
      threshold: 75,
      enabled: true,
    },
  },
  {
    key: "admissions",
    label: "Pending admissions",
    icon: UserPlus,
    values: {
      name: "Pending admissions",
      description: "Counts admission applications still awaiting review.",
      trigger: "admission_pending",
      threshold: 75,
      enabled: true,
    },
  },
];

function formatRunAt(iso: string): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleString();
}

export default function WorkflowsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    workflowsApi,
    filters,
    { label: "rule", describe: (r) => r.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [viewing, setViewing] = useState<Workflow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Workflow | null>(null);

  const [runningAll, setRunningAll] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      total: items.length,
      enabled: items.filter((r) => r.enabled).length,
      runs: items.reduce((sum, r) => sum + (r.runCount || 0), 0),
    }),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: WorkflowSchema) => {
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

  const toggleEnabled = async (rule: Workflow) => {
    setTogglingId(rule.id);
    try {
      await workflowsApi.update(rule.id, { enabled: !rule.enabled });
      toast({
        title: rule.enabled ? "Rule paused" : "Rule enabled",
        description: `${rule.name} is now ${rule.enabled ? "paused" : "active"}.`,
      });
      refetch();
    } catch (e) {
      toast({
        title: "Could not update rule",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const runOne = async (rule: Workflow) => {
    setRunningId(rule.id);
    try {
      const result = await runWorkflow(rule.id);
      toast({
        title: `Ran ${rule.name}`,
        description: result.message,
        variant: result.notified ? "success" : "info",
      });
      refetch();
    } catch (e) {
      toast({
        title: "Run failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setRunningId(null);
    }
  };

  const runAll = async () => {
    setRunningAll(true);
    try {
      const summary = await runAllWorkflows();
      toast({
        title: "Workflows run",
        description: `${summary.ran} rule(s) evaluated · ${summary.notified} alert(s) sent.`,
        variant: summary.notified > 0 ? "success" : "info",
      });
      refetch();
    } catch (e) {
      toast({
        title: "Could not run workflows",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setRunningAll(false);
    }
  };

  const installTemplate = async (tpl: (typeof TEMPLATES)[number]) => {
    setInstalling(tpl.key);
    try {
      await workflowsApi.create(tpl.values);
      toast({ title: "Template installed", description: `${tpl.values.name} was created.` });
      refetch();
    } catch (e) {
      toast({
        title: "Could not install template",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setInstalling(null);
    }
  };

  const columns: Column<Workflow>[] = [
    {
      key: "name",
      header: "Rule",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md gradient-indigo text-white">
            <WorkflowIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{r.name}</p>
            {r.description ? (
              <p className="truncate text-xs text-subtle">{r.description}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "trigger",
      header: "Trigger",
      sortable: true,
      render: (r) => <Badge variant={TRIGGER_VARIANT[r.trigger]}>{TRIGGER_META[r.trigger].label}</Badge>,
    },
    {
      key: "enabled",
      header: "Status",
      render: (r) => (
        <button
          type="button"
          onClick={() => toggleEnabled(r)}
          disabled={togglingId === r.id}
          aria-label={`${r.enabled ? "Disable" : "Enable"} ${r.name}`}
          aria-pressed={r.enabled}
          className={`focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            r.enabled ? "bg-primary" : "bg-border-strong"
          }`}
        >
          <span
            className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
              r.enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      ),
    },
    {
      key: "runCount",
      header: "Runs",
      sortable: true,
      render: (r) => <span className="text-muted">{r.runCount || 0}</span>,
    },
    {
      key: "lastRunAt",
      header: "Last run",
      render: (r) => <span className="whitespace-nowrap text-xs text-subtle">{formatRunAt(r.lastRunAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => runOne(r)}
            disabled={runningId === r.id}
            aria-label={`Run ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-primary-soft hover:text-primary disabled:opacity-60"
          >
            <Play className="size-4" />
          </button>
          <button
            onClick={() => setViewing(r)}
            aria-label={`View ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditing(r);
              setFormOpen(true);
            }}
            aria-label={`Edit ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(r)}
            aria-label={`Delete ${r.name}`}
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
        title="Workflow Automation"
        description="Rules that watch your live data and alert you the moment something needs attention."
        actions={
          <>
            <Button variant="outline" onClick={runAll} disabled={runningAll || items.length === 0}>
              <Repeat className="size-4" />
              {runningAll ? "Running…" : "Run all"}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New rule
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total rules" value={stats.total} icon={WorkflowIcon} tone="indigo" />
        <StatCard label="Enabled" value={stats.enabled} icon={Zap} tone="emerald" />
        <StatCard label="Total runs" value={stats.runs} icon={CircleCheck} tone="cyan" />
      </div>

      {/* One-click templates */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-semibold text-text">Quick templates</p>
          </div>
          <p className="text-xs text-muted">
            Install a ready-made rule with sensible defaults — you can edit it afterwards.
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <Button
                  key={tpl.key}
                  size="sm"
                  variant="outline"
                  onClick={() => installTemplate(tpl)}
                  disabled={installing === tpl.key}
                >
                  <Icon className="size-4" />
                  {installing === tpl.key ? "Installing…" : tpl.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Automation rules</h2>
            <p className="mt-0.5 text-xs text-muted">
              Toggle a rule to pause or resume it, or run one on demand.
            </p>
          </div>
          <div className="w-60">
            <Input
              type="search"
              placeholder="Search rules…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="size-4" />}
              aria-label="Search workflows"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm font-medium text-danger">{error}</p>
              <Button variant="outline" onClick={refetch}>
                Try again
              </Button>
            </div>
          ) : (
            <Table
              columns={columns}
              rows={items}
              rowKey={(r) => r.id}
              loading={loading}
              emptyTitle="No automation rules yet"
              emptyDescription={
                search
                  ? "Try clearing your search to see more results."
                  : "Install a template above or create your first rule."
              }
              emptyAction={
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="size-4" />
                  New rule
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <WorkflowFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.name ?? "Rule"}
        description={viewing ? TRIGGER_META[viewing.trigger].label : ""}
        rows={
          viewing
            ? [
                { label: "Name", value: viewing.name },
                { label: "Trigger", value: TRIGGER_META[viewing.trigger].label },
                { label: "What it does", value: TRIGGER_META[viewing.trigger].description, full: true },
                { label: "Description", value: viewing.description || "—", full: true },
                { label: "Status", value: viewing.enabled ? "Enabled" : "Paused" },
                {
                  label: "Attendance threshold",
                  value: viewing.trigger === "attendance_low" ? `${viewing.threshold}%` : "—",
                },
                { label: "Total runs", value: String(viewing.runCount || 0) },
                { label: "Last run", value: formatRunAt(viewing.lastRunAt) },
              ]
            : []
        }
        footer={
          viewing ? (
            <Button
              variant="outline"
              onClick={() => {
                setEditing(viewing);
                setViewing(null);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          ) : null
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete rule?"
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
