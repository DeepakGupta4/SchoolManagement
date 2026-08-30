"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Search,
  ShieldX,
  XCircle,
  Ban,
  CreditCard,
  GraduationCap,
  SlidersHorizontal,
  CalendarPlus,
  Gift,
  Play,
  Loader2,
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
  Textarea,
  useToast,
  type Column,
} from "@/components/ui";
import { useAuthStore } from "@/store";
import { useAsyncList } from "@/hooks/useAsyncList";
import {
  approveSchoolRequest,
  getRequestStats,
  listSchoolRequests,
  rejectSchoolRequest,
  type ApproveResult,
  type RequestStats,
  type RequestStatus,
  type SchoolRequest,
  type TrialStatus,
} from "@/lib/api/schoolRequests";
import {
  activateFree,
  activatePaid,
  extendTrial,
  resumeSchool,
  suspendSchool,
} from "@/lib/api/schools";

const STATUS_TABS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const REQUEST_BADGE: Record<RequestStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const TRIAL_BADGE: Record<TrialStatus, "info" | "success" | "danger" | "default"> = {
  trial: "info",
  active: "success",
  expired: "danger",
  suspended: "default",
  cancelled: "default",
  payment_pending: "default",
};

const TRIAL_LABEL: Record<TrialStatus, string> = {
  trial: "Trial Active",
  active: "Paid / Active",
  expired: "Trial Expired",
  suspended: "Suspended",
  cancelled: "Cancelled",
  payment_pending: "Payment Pending",
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  gradient: string;
}) {
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

export default function SchoolRequestsPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState<RequestStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const fetcher = useCallback(
    () => listSchoolRequests({ status, search }),
    [status, search]
  );
  const { items: requests, loading, error, refetch } = useAsyncList<SchoolRequest>(fetcher);

  const [stats, setStats] = useState<RequestStats | null>(null);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      getRequestStats()
        .then((s) => {
          if (!cancelled) setStats(s);
        })
        .catch(() => {
          /* stats are non-critical; ignore */
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const [viewing, setViewing] = useState<SchoolRequest | null>(null);
  const [rejecting, setRejecting] = useState<SchoolRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveResult, setApproveResult] = useState<(ApproveResult & { schoolName: string }) | null>(null);
  const [managing, setManaging] = useState<SchoolRequest | null>(null);
  const [manageBusy, setManageBusy] = useState(false);

  const runManage = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setManageBusy(true);
      try {
        await fn();
        toast({ title: label });
        setManaging(null);
        reload();
      } catch (e) {
        toast({
          title: "Action failed",
          description: e instanceof Error ? e.message : "Please try again.",
          variant: "error",
        });
      } finally {
        setManageBusy(false);
      }
    },
    [toast, reload]
  );

  const handleApprove = useCallback(
    async (req: SchoolRequest) => {
      setBusyId(req.id);
      try {
        const result = await approveSchoolRequest(req.id);
        setApproveResult({ ...result, schoolName: req.schoolName });
        setViewing(null);
        toast({
          title: "School approved",
          description: result.emailDelivered
            ? `Credentials emailed to ${result.email}.`
            : `Account created. Email is off — share the password shown.`,
        });
        reload();
      } catch (e) {
        toast({
          title: "Approval failed",
          description: e instanceof Error ? e.message : "Please try again.",
          variant: "error",
        });
      } finally {
        setBusyId(null);
      }
    },
    [toast, reload]
  );

  const handleReject = useCallback(async () => {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await rejectSchoolRequest(rejecting.id, rejectReason.trim() || undefined);
      toast({ title: "Request rejected", description: `${rejecting.schoolName} was notified.` });
      setRejecting(null);
      setRejectReason("");
      reload();
    } catch (e) {
      toast({
        title: "Could not reject",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }, [rejecting, rejectReason, toast, reload]);

  const columns = useMemo<Column<SchoolRequest>[]>(
    () => [
      {
        key: "schoolName",
        header: "School",
        render: (r) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{r.schoolName}</p>
            <p className="truncate text-xs text-muted">
              {[r.city, r.state].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        ),
      },
      {
        key: "ownerName",
        header: "Owner",
        render: (r) => (
          <div className="min-w-0">
            <p className="truncate text-text">{r.ownerName}</p>
            <p className="truncate text-xs text-muted">{r.email}</p>
          </div>
        ),
      },
      {
        key: "size",
        header: "Size",
        render: (r) => (
          <span className="text-sm text-muted">
            {r.studentCount} students · {r.teacherCount} staff
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Registered",
        sortable: true,
        sortValue: (r) => r.createdAt,
        render: (r) => <span className="text-sm text-muted">{fmtDate(r.createdAt)}</span>,
      },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <Badge variant={REQUEST_BADGE[r.status]} className="capitalize">
            {r.status}
          </Badge>
        ),
      },
      {
        key: "trialStatus",
        header: "Trial",
        render: (r) =>
          r.trialStatus ? (
            <div className="min-w-0">
              <Badge variant={TRIAL_BADGE[r.trialStatus]}>{TRIAL_LABEL[r.trialStatus]}</Badge>
              {r.trialEndDate && (
                <p className="mt-0.5 text-[11px] text-muted">till {fmtDate(r.trialEndDate)}</p>
              )}
            </div>
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (r) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setViewing(r)}>
              <Eye className="size-4" />
            </Button>
            {r.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={busyId === r.id}
                  onClick={() => handleApprove(r)}
                >
                  <CheckCircle2 className="size-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === r.id}
                  onClick={() => setRejecting(r)}
                >
                  <XCircle className="size-4" />
                </Button>
              </>
            )}
            {r.status === "approved" && r.schoolId && (
              <Button size="sm" variant="outline" onClick={() => setManaging(r)}>
                <SlidersHorizontal className="size-4" /> Manage
              </Button>
            )}
          </div>
        ),
      },
    ],
    [busyId, handleApprove]
  );

  // Platform-only page. The API also enforces this, but hide it cleanly here.
  if (user && user.role !== "super_admin") {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <ShieldX className="mx-auto size-10 text-muted" />
          <h1 className="mt-3 text-lg font-semibold text-text">Restricted area</h1>
          <p className="mt-1 text-sm text-muted">
            Only the platform owner can review school registrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="School Requests"
        description="Review demo requests, approve schools and start their 7-day free trial."
      />

      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Schools" value={stats.totalSchools} icon={Building2} gradient="bg-gradient-to-br from-indigo-500 to-violet-500" />
          <StatCard label="Pending" value={stats.pendingRequests} icon={Clock} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
          <StatCard label="Active Trials" value={stats.activeTrials} icon={GraduationCap} gradient="bg-gradient-to-br from-sky-500 to-blue-500" />
          <StatCard label="Trials Expired" value={stats.trialsExpired} icon={XCircle} gradient="bg-gradient-to-br from-rose-500 to-red-500" />
          <StatCard label="Paid" value={stats.paidSchools} icon={CreditCard} gradient="bg-gradient-to-br from-emerald-500 to-green-500" />
          <StatCard label="Suspended" value={stats.suspendedSchools} icon={Ban} gradient="bg-gradient-to-br from-slate-500 to-slate-600" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-primary text-white"
                  : "bg-surface-hover text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school, owner or email…"
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-danger-text">{error}</CardContent>
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={requests}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No requests"
          emptyDescription="New school registrations will appear here."
        />
      )}

      {/* View details */}
      <Modal
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.schoolName ?? ""}
        description="School registration details"
        size="lg"
        footer={
          viewing?.status === "pending" ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => viewing && setRejecting(viewing)}>
                Reject
              </Button>
              <Button
                variant="primary"
                disabled={busyId === viewing?.id}
                onClick={() => viewing && handleApprove(viewing)}
              >
                <CheckCircle2 className="size-4" /> Approve & start trial
              </Button>
            </div>
          ) : undefined
        }
      >
        {viewing && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Owner / Principal" value={viewing.ownerName} />
            <Detail label="Email" value={viewing.email} />
            <Detail label="Phone" value={viewing.phone} />
            <Detail label="School type" value={viewing.schoolType || "—"} />
            <Detail label="Students" value={String(viewing.studentCount)} />
            <Detail label="Teachers" value={String(viewing.teacherCount)} />
            <Detail
              label="Address"
              value={[viewing.address, viewing.city, viewing.state, viewing.country].filter(Boolean).join(", ") || "—"}
              full
            />
            <Detail
              label="Website"
              value={viewing.website || "—"}
              full
            />
            {viewing.message && <Detail label="Message" value={viewing.message} full />}
            {viewing.schoolId && <Detail label="School ID" value={viewing.schoolId} full />}
            {viewing.rejectionReason && (
              <Detail label="Rejection reason" value={viewing.rejectionReason} full />
            )}
          </div>
        )}
      </Modal>

      {/* Reject with reason */}
      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => {
          if (!o) {
            setRejecting(null);
            setRejectReason("");
          }
        }}
        title={`Reject ${rejecting?.schoolName ?? ""}?`}
        description="The school will be notified by email. You can add an optional reason."
        confirmLabel="Reject request"
        destructive
        onConfirm={handleReject}
      >
        <Textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={3}
        />
      </ConfirmDialog>

      {/* Approval result — shows the one-time temporary password */}
      <Modal
        open={!!approveResult}
        onOpenChange={(o) => !o && setApproveResult(null)}
        title="School approved 🎉"
        description="A 7-day free trial has started."
        size="md"
        footer={
          <Button variant="primary" onClick={() => setApproveResult(null)}>
            Done
          </Button>
        }
      >
        {approveResult && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-hover p-4">
              <p className="text-sm font-medium text-text">{approveResult.schoolName}</p>
              <div className="mt-3 space-y-2 text-sm">
                <CredRow label="Login email" value={approveResult.email} onCopy={() => copy(approveResult.email, toast)} />
                <CredRow
                  label="Temporary password"
                  value={approveResult.temporaryPassword}
                  mono
                  onCopy={() => copy(approveResult.temporaryPassword, toast)}
                />
                <div className="flex justify-between">
                  <span className="text-muted">Trial ends</span>
                  <span className="font-medium text-text">{fmtDate(approveResult.trialEndDate)}</span>
                </div>
              </div>
            </div>
            <div
              className={`rounded-md px-3 py-2 text-xs ${
                approveResult.emailDelivered
                  ? "bg-success-soft text-success-text"
                  : "bg-warning-soft text-warning-text"
              }`}
            >
              {approveResult.emailDelivered
                ? "Credentials were emailed to the school."
                : "Email delivery is off — copy the password above and share it with the school. It won't be shown again."}
            </div>
          </div>
        )}
      </Modal>

      {/* Subscription controls (super admin overrides) */}
      <Modal
        open={!!managing}
        onOpenChange={(o) => !o && setManaging(null)}
        title={`Manage ${managing?.schoolName ?? ""}`}
        description="Subscription controls"
        size="md"
      >
        {managing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-hover px-4 py-3 text-sm">
              <span className="text-muted">Current status</span>
              {managing.trialStatus ? (
                <Badge variant={TRIAL_BADGE[managing.trialStatus]}>
                  {TRIAL_LABEL[managing.trialStatus]}
                </Badge>
              ) : (
                <span className="text-text">—</span>
              )}
            </div>

            {manageBusy && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Applying…
              </p>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <ManageBtn
                icon={CalendarPlus}
                label="Extend 7 days"
                disabled={manageBusy}
                onClick={() => runManage("Trial extended 7 days", () => extendTrial(managing.schoolId, 7))}
              />
              <ManageBtn
                icon={CalendarPlus}
                label="Extend 30 days"
                disabled={manageBusy}
                onClick={() => runManage("Trial extended 30 days", () => extendTrial(managing.schoolId, 30))}
              />
              <ManageBtn
                icon={Gift}
                label="Activate Free"
                disabled={manageBusy}
                onClick={() => runManage("Free access granted", () => activateFree(managing.schoolId))}
              />
              {managing.trialStatus === "suspended" ? (
                <ManageBtn
                  icon={Play}
                  label="Resume"
                  disabled={manageBusy}
                  onClick={() => runManage("Account resumed", () => resumeSchool(managing.schoolId))}
                />
              ) : (
                <ManageBtn
                  icon={Ban}
                  label="Suspend"
                  disabled={manageBusy}
                  danger
                  onClick={() => runManage("Account suspended", () => suspendSchool(managing.schoolId))}
                />
              )}
              <ManageBtn
                icon={CreditCard}
                label="Activate Monthly"
                disabled={manageBusy}
                onClick={() => runManage("Monthly plan activated", () => activatePaid(managing.schoolId, "monthly"))}
              />
              <ManageBtn
                icon={CreditCard}
                label="Activate Yearly"
                disabled={manageBusy}
                onClick={() => runManage("Yearly plan activated", () => activatePaid(managing.schoolId, "yearly"))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ManageBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof CalendarPlus;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        danger
          ? "border-danger-soft text-danger-text hover:bg-danger-soft"
          : "border-border text-text hover:bg-surface-hover"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}

function Detail({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 wrap-break-word text-text">{value}</p>
    </div>
  );
}

function CredRow({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`font-medium text-text ${mono ? "font-mono" : ""}`}>{value}</span>
        <button
          onClick={onCopy}
          className="rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-text"
          aria-label={`Copy ${label}`}
        >
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
