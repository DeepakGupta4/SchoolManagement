"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Building2,
  Search,
  ShieldX,
  SlidersHorizontal,
  CalendarPlus,
  Gift,
  Play,
  Ban,
  CreditCard,
  KeyRound,
  Copy,
  Loader2,
  GraduationCap,
  XCircle,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  Modal,
  PageHeader,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { useAuthStore } from "@/store";
import { useAsyncList } from "@/hooks/useAsyncList";
import {
  activateFree,
  activatePaid,
  deleteSchool,
  extendTrial,
  listSchools,
  resetSchoolPassword,
  resumeSchool,
  suspendSchool,
  type ManagedSchool,
} from "@/lib/api/schools";
import type { SubscriptionStatus } from "@/lib/api/subscription";

const STATUS_TABS: { value: SubscriptionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "trial", label: "Trial" },
  { value: "active", label: "Paid / Active" },
  { value: "expired", label: "Expired" },
  { value: "suspended", label: "Suspended" },
];

const BADGE: Record<SubscriptionStatus, "info" | "success" | "danger" | "default"> = {
  trial: "info",
  active: "success",
  expired: "danger",
  suspended: "default",
  cancelled: "default",
  payment_pending: "default",
};

const LABEL: Record<SubscriptionStatus, string> = {
  trial: "Trial",
  active: "Paid / Active",
  expired: "Expired",
  suspended: "Suspended",
  cancelled: "Cancelled",
  payment_pending: "Payment Pending",
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, icon: Icon, gradient }: { label: string; value: number; icon: typeof Building2; gradient: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-md text-white ${gradient}`}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-0.5 text-lg font-semibold text-text">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SchoolsPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const [search, setSearch] = useState("");

  const fetcher = useCallback(() => listSchools(), []);
  const { items: schools, loading, error, refetch } = useAsyncList<ManagedSchool>(fetcher);

  const [managing, setManaging] = useState<ManagedSchool | null>(null);
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<{ schoolName: string; email: string; password: string; emailDelivered: boolean } | null>(null);
  const [deleting, setDeleting] = useState<ManagedSchool | null>(null);

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await deleteSchool(deleting.schoolId);
      toast({ title: "School deleted", description: `${deleting.name} and its data were removed.` });
      setDeleting(null);
      refetch();
    } catch (e) {
      toast({ title: "Delete failed", description: e instanceof Error ? e.message : "Please try again.", variant: "error" });
    }
  }, [deleting, toast, refetch]);

  const stats = useMemo(() => {
    const s = { total: schools.length, trial: 0, active: 0, expired: 0, suspended: 0 };
    for (const sc of schools) {
      const st = sc.access.status;
      if (st === "trial") s.trial++;
      else if (st === "active") s.active++;
      else if (st === "expired") s.expired++;
      else if (st === "suspended") s.suspended++;
    }
    return s;
  }, [schools]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      if (status !== "all" && s.access.status !== status) return false;
      if (q && !`${s.name} ${s.ownerName} ${s.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [schools, status, search]);

  const run = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        toast({ title: label });
        setManaging(null);
        refetch();
      } catch (e) {
        toast({ title: "Action failed", description: e instanceof Error ? e.message : "Please try again.", variant: "error" });
      } finally {
        setBusy(false);
      }
    },
    [toast, refetch]
  );

  const resetPassword = useCallback(
    async (school: ManagedSchool) => {
      setBusy(true);
      try {
        const r = await resetSchoolPassword(school.schoolId);
        setManaging(null);
        setCreds({ schoolName: school.name, email: r.email, password: r.temporaryPassword, emailDelivered: r.emailDelivered });
        refetch();
      } catch (e) {
        toast({ title: "Reset failed", description: e instanceof Error ? e.message : "Please try again.", variant: "error" });
      } finally {
        setBusy(false);
      }
    },
    [toast, refetch]
  );

  const columns = useMemo<Column<ManagedSchool>[]>(
    () => [
      {
        key: "name",
        header: "School",
        render: (s) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-muted">
              {[s.city, s.state].filter(Boolean).join(", ") || s.schoolId}
            </p>
          </div>
        ),
      },
      {
        key: "ownerName",
        header: "Owner",
        render: (s) => (
          <div className="min-w-0">
            <p className="truncate text-text">{s.ownerName}</p>
            <p className="truncate text-xs text-muted">{s.email}</p>
          </div>
        ),
      },
      {
        key: "usage",
        header: "Usage",
        render: (s) => (
          <div className="text-sm leading-tight">
            <p className="text-text">
              {s.studentsAdded} <span className="text-muted">students</span>
            </p>
            <p className="text-text">
              {s.staffAdded} <span className="text-muted">staff</span>
            </p>
          </div>
        ),
      },
      { key: "plan", header: "Plan", render: (s) => <span className="text-sm capitalize text-muted">{s.subscription.plan}</span> },
      {
        key: "status",
        header: "Status",
        render: (s) => <Badge variant={BADGE[s.access.status]}>{LABEL[s.access.status]}</Badge>,
      },
      {
        key: "ends",
        header: "Ends",
        render: (s) => {
          const end = s.access.paidEndDate ?? s.access.trialEndDate;
          return (
            <div className="min-w-0">
              <p className="text-sm text-text">{fmtDate(end)}</p>
              {s.access.daysRemaining != null && s.access.allowed && (
                <p className="text-[11px] text-muted">{s.access.daysRemaining} days left</p>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (s) => (
          <Button size="sm" variant="outline" onClick={() => setManaging(s)}>
            <SlidersHorizontal className="size-4" /> Manage
          </Button>
        ),
      },
    ],
    []
  );

  if (user && user.role !== "super_admin") {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <ShieldX className="mx-auto size-10 text-muted" />
          <h1 className="mt-3 text-lg font-semibold text-text">Restricted area</h1>
          <p className="mt-1 text-sm text-muted">Only the platform owner can manage schools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Schools" description="Every school on the platform — manage subscriptions and access." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={Building2} gradient="bg-gradient-to-br from-indigo-500 to-violet-500" />
        <StatCard label="On Trial" value={stats.trial} icon={GraduationCap} gradient="bg-gradient-to-br from-sky-500 to-blue-500" />
        <StatCard label="Paid" value={stats.active} icon={CreditCard} gradient="bg-gradient-to-br from-emerald-500 to-green-500" />
        <StatCard label="Expired" value={stats.expired} icon={XCircle} gradient="bg-gradient-to-br from-rose-500 to-red-500" />
        <StatCard label="Suspended" value={stats.suspended} icon={Ban} gradient="bg-gradient-to-br from-slate-500 to-slate-600" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value ? "bg-primary text-white" : "bg-surface-hover text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search school, owner or email…" className="pl-9" />
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-danger-text">{error}</CardContent>
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No schools yet"
          emptyDescription="Approved schools will appear here."
        />
      )}

      {/* Manage subscription */}
      <Modal
        open={!!managing}
        onOpenChange={(o) => !o && setManaging(null)}
        title={`Manage ${managing?.name ?? ""}`}
        description="Subscription controls"
        size="md"
      >
        {managing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-surface-hover p-4 text-sm">
              <Info label="Owner" value={managing.ownerName} />
              <Info label="Email" value={managing.email} />
              <Info label="Phone" value={managing.phone || "—"} />
              <Info label="Location" value={[managing.city, managing.state].filter(Boolean).join(", ") || "—"} />
              <Info label="Students added" value={String(managing.studentsAdded)} />
              <Info label="Staff added" value={String(managing.staffAdded)} />
              <Info label="Joined" value={fmtDate(managing.createdAt)} />
              <Info label="School ID" value={managing.schoolId} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-hover px-4 py-3 text-sm">
              <span className="text-muted">Current status</span>
              <Badge variant={BADGE[managing.access.status]}>{LABEL[managing.access.status]}</Badge>
            </div>

            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Applying…
              </p>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <ManageBtn icon={CalendarPlus} label="Extend 7 days" disabled={busy} onClick={() => run("Extended 7 days", () => extendTrial(managing.schoolId, 7))} />
              <ManageBtn icon={CalendarPlus} label="Extend 30 days" disabled={busy} onClick={() => run("Extended 30 days", () => extendTrial(managing.schoolId, 30))} />
              <ManageBtn icon={Gift} label="Activate Free" disabled={busy} onClick={() => run("Free access granted", () => activateFree(managing.schoolId))} />
              {managing.access.status === "suspended" ? (
                <ManageBtn icon={Play} label="Resume" disabled={busy} onClick={() => run("Account resumed", () => resumeSchool(managing.schoolId))} />
              ) : (
                <ManageBtn icon={Ban} label="Suspend" disabled={busy} danger onClick={() => run("Account suspended", () => suspendSchool(managing.schoolId))} />
              )}
              <ManageBtn icon={CreditCard} label="Activate Monthly" disabled={busy} onClick={() => run("Monthly plan activated", () => activatePaid(managing.schoolId, "monthly"))} />
              <ManageBtn icon={CreditCard} label="Activate Yearly" disabled={busy} onClick={() => run("Yearly plan activated", () => activatePaid(managing.schoolId, "yearly"))} />
              <ManageBtn icon={KeyRound} label="Reset password" disabled={busy} onClick={() => resetPassword(managing)} />
            </div>

            <button
              disabled={busy}
              onClick={() => {
                const d = managing;
                setManaging(null);
                setDeleting(d);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger-soft px-3 py-2.5 text-sm font-medium text-danger-text transition-colors hover:bg-danger-soft disabled:opacity-50"
            >
              <Trash2 className="size-4" /> Delete school permanently
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? ""}?`}
        description="This permanently removes the school, all its user logins and its registration request. This cannot be undone."
        confirmLabel="Delete permanently"
        destructive
        onConfirm={handleDelete}
      />

      {/* Credentials after reset */}
      <Modal
        open={!!creds}
        onOpenChange={(o) => !o && setCreds(null)}
        title="Password reset"
        description="Share these login details with the school."
        size="md"
        footer={<Button variant="primary" onClick={() => setCreds(null)}>Done</Button>}
      >
        {creds && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-hover p-4">
              <p className="text-sm font-medium text-text">{creds.schoolName}</p>
              <div className="mt-3 space-y-2 text-sm">
                <CredRow label="Login email" value={creds.email} onCopy={() => copy(creds.email, toast)} />
                <CredRow label="Temporary password" value={creds.password} mono onCopy={() => copy(creds.password, toast)} />
              </div>
            </div>
            <div className={`rounded-md px-3 py-2 text-xs ${creds.emailDelivered ? "bg-success-soft text-success-text" : "bg-warning-soft text-warning-text"}`}>
              {creds.emailDelivered
                ? "Credentials were emailed to the school."
                : "Email delivery is off — copy the password above and share it. It won't be shown again."}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate text-text" title={value}>{value}</p>
    </div>
  );
}

function ManageBtn({ icon: Icon, label, onClick, disabled, danger }: { icon: typeof CalendarPlus; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        danger ? "border-danger-soft text-danger-text hover:bg-danger-soft" : "border-border text-text hover:bg-surface-hover"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}

function CredRow({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`font-medium text-text ${mono ? "font-mono" : ""}`}>{value}</span>
        <button onClick={onCopy} className="rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-text" aria-label={`Copy ${label}`}>
          <Copy className="size-3.5" />
        </button>
      </span>
    </div>
  );
}

function copy(text: string, toast: ReturnType<typeof useToast>["toast"]) {
  navigator.clipboard?.writeText(text).then(
    () => toast({ title: "Copied", variant: "success" }),
    () => toast({ title: "Copy failed", variant: "error" })
  );
}
