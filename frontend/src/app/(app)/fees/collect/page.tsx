"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarClock,
  CheckCircle2,
  History,
  Printer,
  Search,
  TriangleAlert,
  User,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { useAsyncList } from "@/hooks/useAsyncList";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSchoolIdentity } from "@/lib/schoolIdentity";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  autoAllocate,
  balanceOf,
  CLEARS_LATER,
  collectPayment,
  feeAccountsApi,
  FEE_STANDING_LABEL,
  feeStandingOf,
  headBalance,
  isCleared,
  isUnbilled,
  PAYMENT_METHODS,
  paymentsApi,
  REFERENCE_LABEL,
  REFERENCE_REQUIRED,
  totalBilled,
  totalPaid,
  type FeeHeadDue,
  type FeeStanding,
  type PaymentAllocation,
  type PaymentMethod,
  type Payment,
  type StudentFeeAccount,
} from "@/lib/api/feeLedger";
import { PaymentReceipt } from "./PaymentReceipt";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const STANDING_BADGE: Record<FeeStanding, "success" | "warning" | "danger" | "default"> = {
  paid: "success",
  partial: "warning",
  overdue: "danger",
  due: "default",
};

/** The late fee rides in the allocation list under this exact name (matches the server). */
const LATE_FEE_HEAD = "Late Fee";

/** Quick amounts a clerk reaches for before typing a custom figure. */
const QUICK_PRESETS = [
  { label: "Full balance", of: (b: number) => b },
  { label: "Half", of: (b: number) => Math.round(b / 2) },
  { label: "₹5,000", of: () => 5000 },
  { label: "₹2,000", of: () => 2000 },
];

/** The per-period amount stored on a head (one month / one exam). */
const headUnit = (h: FeeHeadDue) => Math.max(0, Math.round(Number(h.unit) || 0));

/** How a head reads at a glance — "₹4,500/mo", "₹500/exam", or "One-time". */
function headCadenceLabel(h: FeeHeadDue): string {
  const unit = headUnit(h);
  if (h.frequency === "monthly") return unit > 0 ? `${inr(unit)}/mo` : "Monthly";
  if (h.frequency === "per-exam") return unit > 0 ? `${inr(unit)}/exam` : "Per-exam";
  return "One-time";
}

/** One instalment to add for a head: a month, an exam, or (one-time) the whole due. */
function headInstalment(h: FeeHeadDue): number {
  const due = headBalance(h);
  if (h.frequency === "monthly" || h.frequency === "per-exam") {
    const unit = headUnit(h);
    return Math.min(due, unit > 0 ? unit : due);
  }
  return due;
}

/** Label for a head's quick-add button. */
function instalmentLabel(h: FeeHeadDue): string {
  if (h.frequency === "monthly") return "+1 month";
  if (h.frequency === "per-exam") return "+1 exam";
  return "Add full";
}

/**
 * One month's worth of each MONTHLY head (capped at its due) — the default a
 * clerk collects: tuition and other recurring heads shown for the current month,
 * with one-time and per-exam heads added only when selected. Mirrors how a real
 * ERP front desk takes the monthly instalment.
 */
function monthlyDefaults(account: StudentFeeAccount): Record<string, string> {
  const next: Record<string, string> = {};
  for (const h of account.heads) {
    if (h.frequency !== "monthly") continue;
    const amt = Math.min(headUnit(h), headBalance(h));
    if (amt > 0) next[h.head] = String(amt);
  }
  return next;
}

/**
 * One exam's worth of each PER-EXAM head (capped at its due) — exam fee and
 * report-card fee are separate heads, both added one exam at a time when the
 * office collects exam-time dues.
 */
function examDefaults(account: StudentFeeAccount): Record<string, string> {
  const next: Record<string, string> = {};
  for (const h of account.heads) {
    if (h.frequency !== "per-exam") continue;
    const amt = Math.min(headUnit(h), headBalance(h));
    if (amt > 0) next[h.head] = String(amt);
  }
  return next;
}

export default function CollectFeePage() {
  const { toast } = useToast();
  const { classOptions } = useClassOptions();
  const collector = useAuthStore((s) => s.user?.name ?? "Front Desk");
  const { identity } = useSchoolIdentity();

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  // Default to every student in the class — a clerk needs to find anyone to
  // collect from, not only those already flagged with dues.
  const [standing, setStanding] = useState("all");

  // Deps are the primitive filter values, so the fetcher only changes when a
  // filter actually changes — not on every unrelated render.
  const fetcher = useCallback(
    () => feeAccountsApi.list({ search, className, standing }),
    [search, className, standing]
  );
  const { items: accounts, loading, error, refetch } = useAsyncList<StudentFeeAccount>(fetcher);

  // Selection is keyed on the student, not the account id: a provisional row's
  // id becomes a real account id after its first payment, and keying on the
  // student keeps that student selected across the change.
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const selected = accounts.find((a) => a.studentId === selectedStudentId) ?? null;

  // Deep-link from the Students list "Collect fee" action: surface the student by
  // their admission no. and pre-select them. Read from the URL once on mount —
  // client-only, so it needs no Suspense boundary.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const sid = params.get("student");
    if (!q && !sid) return;
    // Deferred so state isn't set synchronously in the effect (set-state-in-effect).
    const t = setTimeout(() => {
      if (q) setSearch(q);
      if (sid) setSelectedStudentId(sid);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Per-head amounts the clerk is collecting right now, keyed by head name.
  const [entered, setEntered] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [reference, setReference] = useState("");
  const [bank, setBank] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);

  // The student we've already pre-filled monthly defaults for, so switching
  // students prefills once without clobbering edits or re-filling after a payment.
  const prefilledFor = useRef<string | null>(null);

  // The selected student's own receipts (their payment history).
  const [history, setHistory] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyNonce, setHistoryNonce] = useState(0);

  const balance = selected ? balanceOf(selected) : 0;
  // Which cadences still have dues — drives the "This month" / "This exam" presets.
  const hasMonthlyDue = Boolean(
    selected?.heads.some((h) => h.frequency === "monthly" && headBalance(h) > 0)
  );
  const hasExamDue = Boolean(
    selected?.heads.some((h) => h.frequency === "per-exam" && headBalance(h) > 0)
  );

  // Load the student's history when the selection changes or a payment lands.
  // Deferred with a 0ms timer so state isn't set synchronously inside the
  // effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!selectedStudentId) return;
    let cancelled = false;
    const t = setTimeout(() => {
      setHistoryLoading(true);
      paymentsApi
        .list({ studentId: selectedStudentId })
        .then((rows) => {
          if (!cancelled) setHistory(rows);
        })
        .catch(() => {
          if (!cancelled) setHistory([]);
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [selectedStudentId, historyNonce]);

  // Pre-fill this month's recurring instalment when a student is first selected —
  // tuition and other monthly heads show their monthly amount by default, so the
  // clerk collects the month in one tap and adds one-time/per-exam heads on top.
  // Ref-guarded by studentId so it runs once per student (not after each payment
  // or an unrelated refetch), and never overrides what the clerk has typed.
  useEffect(() => {
    if (!selected) return;
    if (prefilledFor.current === selected.studentId) return;
    prefilledFor.current = selected.studentId;
    if (isUnbilled(selected) || isCleared(selected)) return;
    const defaults = monthlyDefaults(selected);
    if (Object.keys(defaults).length === 0) return;
    // Deferred so state isn't set synchronously in the effect (lint rule used
    // throughout this file).
    const t = setTimeout(() => setEntered(defaults), 0);
    return () => clearTimeout(t);
  }, [selected]);

  // Cheap to recompute each render; the React Compiler handles memoisation.
  const allocations: PaymentAllocation[] = !selected
    ? []
    : Object.entries(entered)
        .map(([head, value]) => ({ head, amount: Math.max(0, Math.round(Number(value) || 0)) }))
        .filter((a) => a.amount > 0);

  const collecting = allocations.reduce((sum, a) => sum + a.amount, 0);
  const overpaying = collecting > balance;
  // The scalar late fee is only addressed as "Late Fee" when no billed head owns
  // that (free-form) name; a real "Late Fee" head is checked in the heads loop.
  const lateFeeIsScalar = !selected?.heads.some((h) => h.head === LATE_FEE_HEAD);
  // No single head (nor the late fee) may be paid beyond its own due — else one
  // head is overpaid while another stays unpaid. The server rejects this too.
  const headOver = Boolean(
    selected &&
      (selected.heads.some((h) => Math.round(Number(entered[h.head]) || 0) > headBalance(h)) ||
        (lateFeeIsScalar &&
          Math.round(Number(entered[LATE_FEE_HEAD]) || 0) > (selected.lateFee || 0)))
  );
  const referenceMissing = REFERENCE_REQUIRED.includes(method) && !reference.trim();
  const canSubmit =
    Boolean(selected) && collecting > 0 && !overpaying && !headOver && !referenceMissing;

  const pickStudent = (account: StudentFeeAccount) => {
    setSelectedStudentId(account.studentId);
    setEntered({});
    setReference("");
    setBank("");
    setRemarks("");
    setReceipt(null);
  };

  /** Spreads an amount over the outstanding heads, oldest first. */
  const applyPreset = (amount: number) => {
    if (!selected) return;
    const capped = Math.min(amount, balance);
    const next: Record<string, string> = {};
    for (const a of autoAllocate(selected, capped)) next[a.head] = String(a.amount);
    setEntered(next);
  };

  const setHead = (head: string, value: string) =>
    setEntered((prev) => ({ ...prev, [head]: value.replace(/[^\d]/g, "") }));

  /** Fill every monthly head with one month's amount, keeping anything else entered. */
  const fillThisMonth = () => {
    if (!selected) return;
    setEntered((prev) => ({ ...prev, ...monthlyDefaults(selected) }));
  };

  /** Fill every per-exam head (exam fee, report card…) with one exam's amount. */
  const fillThisExam = () => {
    if (!selected) return;
    setEntered((prev) => ({ ...prev, ...examDefaults(selected) }));
  };

  /** Add one instalment (a month / an exam / the full due) to a head, capped at its due. */
  const addInstalment = (h: FeeHeadDue) => {
    const due = headBalance(h);
    const current = Math.max(0, Math.round(Number(entered[h.head]) || 0));
    const step = headInstalment(h) || due;
    setHead(h.head, String(Math.min(due, current + step)));
  };

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return;
    setSubmitting(true);
    try {
      const payment = await collectPayment({
        account: selected,
        allocations,
        method,
        reference: reference.trim(),
        bank: bank.trim(),
        remarks: remarks.trim(),
        collectedBy: collector,
      });
      setReceipt(payment);
      setEntered({});
      setReference("");
      setBank("");
      setRemarks("");
      refetch();
      setHistoryNonce((n) => n + 1);
      toast({
        title: `Payment of ${inr(payment.amount)} recorded`,
        description: `Receipt ${payment.receiptNo} issued for ${payment.studentName}.`,
      });
    } catch (e) {
      toast({
        title: "Could not record payment",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="print-hide">
        <PageHeader
          title="Collect Fee"
          description="Record a full or part payment against a student's fee account."
        />
      </div>

      <div className="print-hide grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        {/* ---------------- Student picker ---------------- */}
        <Card className="flex max-h-[720px] flex-col overflow-hidden">
          <CardHeader className="flex-col items-stretch gap-3">
            <Input
              type="search"
              placeholder="Search name, admission no. or roll…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="size-4" />}
              aria-label="Search students"
            />
            <div className="flex gap-2">
              <Select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="All classes"
                options={classOptions}
                aria-label="Filter by class"
              />
              <Select
                value={standing}
                onChange={(e) => setStanding(e.target.value)}
                options={[
                  { label: "With dues", value: "due" },
                  { label: "Cleared", value: "cleared" },
                  { label: "All", value: "all" },
                ]}
                aria-label="Filter by standing"
              />
            </div>
          </CardHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && (
              <div className="flex flex-col gap-2 p-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <p className="text-sm text-danger">{error}</p>
                <Button variant="outline" onClick={refetch}>
                  Try again
                </Button>
              </div>
            )}

            {!loading && !error && accounts.length === 0 && (
              <EmptyState
                icon={<User className="size-5" />}
                title="No students found"
                description="Try a different name, class or standing filter."
              />
            )}

            {!loading &&
              !error &&
              accounts.map((a) => {
                const due = balanceOf(a);
                const active = a.studentId === selectedStudentId;
                return (
                  <button
                    key={a.id}
                    onClick={() => pickStudent(a)}
                    aria-pressed={active}
                    className={cn(
                      "focus-ring flex w-full items-center gap-3 border-b border-l-2 border-border px-4 py-3 text-left transition-colors last:border-b-0",
                      active
                        ? "border-l-primary bg-primary-soft"
                        : "border-l-transparent hover:bg-surface-hover"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{a.name}</p>
                      <p className="truncate text-xs text-subtle">
                        {a.admissionNo} · {a.className} {a.section}
                      </p>
                    </div>
                    {due > 0 ? (
                      <span className="shrink-0 text-sm font-semibold text-danger">{inr(due)}</span>
                    ) : (
                      <Badge variant="success">Cleared</Badge>
                    )}
                  </button>
                );
              })}
          </div>
        </Card>

        {/* ---------------- Collection panel ---------------- */}
        {!selected ? (
          <Card>
            <EmptyState
              icon={<Wallet className="size-5" />}
              title="Select a student"
              description="Pick a student from the list to see their fee ledger and record a payment."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Ledger summary */}
            <Card>
              <CardContent className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-text">{selected.name}</p>
                    <Badge variant={STANDING_BADGE[feeStandingOf(selected)]}>
                      {FEE_STANDING_LABEL[feeStandingOf(selected)]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {selected.admissionNo} · {selected.className} {selected.section} · Roll{" "}
                    {selected.rollNo}
                  </p>
                  <p className="mt-0.5 text-xs text-subtle">
                    Guardian: {selected.guardian} · {selected.guardianPhone}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-subtle">
                    <CalendarClock className="size-3.5" />
                    Due date: {selected.dueDate ? formatDate(selected.dueDate) : "Not set"}
                    {" · "}Session {selected.session}
                  </p>
                </div>
                <div className="flex gap-6">
                  {[
                    { label: "Total", value: totalBilled(selected), tone: "text-text" },
                    { label: "Paid", value: totalPaid(selected), tone: "text-success" },
                    { label: "Pending", value: balance, tone: balance > 0 ? "text-danger" : "text-success" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-xs text-subtle">{s.label}</p>
                      <p className={cn("mt-0.5 text-lg font-semibold", s.tone)}>{inr(s.value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isUnbilled(selected) ? (
              <Card>
                <EmptyState
                  icon={<Wallet className="size-5" />}
                  title="No fees billed yet"
                  description={`No fee structure is defined for ${selected.className}. Add one under Fees → Fee Structure, or set the student's fees from their profile, then collect here.`}
                />
              </Card>
            ) : isCleared(selected) ? (
              <Card>
                <EmptyState
                  icon={<CheckCircle2 className="size-5" />}
                  title="No dues outstanding"
                  description={`${selected.name}'s fees are fully paid for session ${selected.session}.`}
                />
              </Card>
            ) : (
              <>
                {/* How much to pay */}
                <Card>
                  <CardHeader>
                    <div>
                      <p className="text-sm font-semibold text-text">How much is being paid now?</p>
                      <p className="mt-0.5 text-xs text-muted">
                        This month&rsquo;s recurring heads are pre-filled. Use <strong>This exam</strong>{" "}
                        to add exam &amp; report-card fees, or set any head below. Part payments are
                        allowed, up to the balance.
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {hasMonthlyDue && (
                        <Button variant="primary" size="sm" onClick={fillThisMonth}>
                          This month
                        </Button>
                      )}
                      {hasExamDue && (
                        <Button variant="primary" size="sm" onClick={fillThisExam}>
                          This exam
                        </Button>
                      )}
                      {QUICK_PRESETS.map((p) => {
                        const amount = Math.min(p.of(balance), balance);
                        return (
                          <Button
                            key={p.label}
                            variant="outline"
                            size="sm"
                            disabled={amount <= 0}
                            onClick={() => applyPreset(amount)}
                          >
                            {p.label}
                            <span className="text-subtle">{inr(amount)}</span>
                          </Button>
                        );
                      })}
                      <Button variant="ghost" size="sm" onClick={() => setEntered({})}>
                        Clear
                      </Button>
                    </div>

                    {/* Per-head allocation */}
                    <div className="overflow-hidden rounded-md border border-border">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border bg-surface-sunken text-xs uppercase tracking-wide text-muted">
                            <th className="px-4 py-2.5 text-left font-semibold">Fee head</th>
                            <th className="px-4 py-2.5 text-right font-semibold">Billed</th>
                            <th className="px-4 py-2.5 text-right font-semibold">Paid</th>
                            <th className="px-4 py-2.5 text-right font-semibold">Due</th>
                            <th className="w-36 px-4 py-2.5 text-right font-semibold">Paying now</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.heads.map((h) => {
                            const due = headBalance(h);
                            const value = entered[h.head] ?? "";
                            const over = Number(value || 0) > due;
                            return (
                              <tr key={h.head} className="border-b border-border last:border-0">
                                <td className="px-4 py-2.5">
                                  <span className="font-medium text-text">{h.head}</span>
                                  <span className="mt-0.5 block text-xs text-subtle">
                                    {headCadenceLabel(h)}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right text-muted">{inr(h.billed)}</td>
                                <td className="px-4 py-2.5 text-right text-muted">{inr(h.paid)}</td>
                                <td
                                  className={cn(
                                    "px-4 py-2.5 text-right font-medium",
                                    due > 0 ? "text-danger" : "text-subtle"
                                  )}
                                >
                                  {due > 0 ? inr(due) : "—"}
                                </td>
                                <td className="px-4 py-2">
                                  <Input
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={value}
                                    disabled={due <= 0}
                                    onChange={(e) => setHead(h.head, e.target.value)}
                                    aria-label={`Amount for ${h.head}`}
                                    className={cn("text-right", over && "border-danger")}
                                  />
                                  {due > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => addInstalment(h)}
                                      className="focus-ring mt-1 ml-auto block rounded px-1.5 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary-soft"
                                    >
                                      {instalmentLabel(h)}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {selected.lateFee > 0 && lateFeeIsScalar && (
                            <tr className="border-b border-border last:border-0 bg-warning-soft/40">
                              <td className="px-4 py-2.5 font-medium text-text">Late Fee</td>
                              <td className="px-4 py-2.5 text-right text-muted">
                                {inr(selected.lateFee)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-muted">—</td>
                              <td className="px-4 py-2.5 text-right font-medium text-warning-text">
                                {inr(selected.lateFee)}
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={entered[LATE_FEE_HEAD] ?? ""}
                                  onChange={(e) => setHead(LATE_FEE_HEAD, e.target.value)}
                                  aria-label="Amount for late fee"
                                  className={cn(
                                    "text-right",
                                    Math.round(Number(entered[LATE_FEE_HEAD]) || 0) > selected.lateFee &&
                                      "border-danger"
                                  )}
                                />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {selected.concession > 0 && (
                      <p className="text-xs text-muted">
                        A concession of{" "}
                        <span className="font-medium text-success-text">
                          {inr(selected.concession)}
                        </span>{" "}
                        is already applied to this account.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Payment method */}
                <Card>
                  <CardHeader>
                    <p className="text-sm font-semibold text-text">Payment details</p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted">Mode</p>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHODS.map((m) => (
                          <Button
                            key={m}
                            size="sm"
                            variant={method === m ? "primary" : "outline"}
                            aria-pressed={method === m}
                            onClick={() => {
                              setMethod(m);
                              setReference("");
                              setBank("");
                            }}
                          >
                            {m}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label={REFERENCE_LABEL[method]}
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        error={referenceMissing ? "Required for this payment mode" : undefined}
                      />
                      {(method === "Cheque" || method === "DD" || method === "Bank Transfer") && (
                        <Input
                          label="Bank"
                          placeholder="e.g. HDFC Bank, Mayur Vihar"
                          value={bank}
                          onChange={(e) => setBank(e.target.value)}
                        />
                      )}
                    </div>

                    <Textarea
                      label="Remarks (optional)"
                      placeholder="e.g. Second instalment, balance promised by 30 Sep"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                    />

                    {CLEARS_LATER.includes(method) && (
                      <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-text">
                        {method} payments are recorded as <strong>pending clearance</strong>. The
                        receipt prints as provisional until the instrument is realised.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Summary + submit */}
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs text-subtle">Collecting now</p>
                        <p
                          className={cn(
                            "mt-0.5 text-2xl font-semibold",
                            overpaying ? "text-danger" : "text-text"
                          )}
                        >
                          {inr(collecting)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle">Balance after</p>
                        <p className="mt-0.5 text-2xl font-semibold text-muted">
                          {inr(Math.max(0, balance - collecting))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {overpaying && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
                          <TriangleAlert className="size-3.5" />
                          Exceeds balance by {inr(collecting - balance)}
                        </span>
                      )}
                      {!overpaying && headOver && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
                          <TriangleAlert className="size-3.5" />
                          A head is over its due — reduce the highlighted amount
                        </span>
                      )}
                      <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                        <BadgeIndianRupee className="size-4" />
                        {submitting ? "Recording…" : `Collect ${inr(collecting)}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Payment history — the student's own receipts */}
            <Card>
              <CardHeader>
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">
                    <History className="size-4" />
                    Payment history
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Receipts recorded for {selected.name}.</p>
                </div>
              </CardHeader>
              <div>
                {historyLoading ? (
                  <div className="flex flex-col gap-2 p-4">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted">No payments recorded yet.</p>
                ) : (
                  history.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">
                          {p.receiptNo} · {formatDate(p.date)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-subtle">
                          {p.method}
                          {p.reference ? ` · ${p.reference}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            p.status === "cancelled" || p.status === "bounced"
                              ? "text-subtle line-through"
                              : "text-text"
                          )}
                        >
                          {inr(p.amount)}
                        </p>
                        <Badge
                          variant={
                            p.status === "paid"
                              ? "success"
                              : p.status === "pending-clearance"
                                ? "warning"
                                : "default"
                          }
                          className="mt-1"
                        >
                          {p.status === "pending-clearance" ? "pending" : p.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ---------------- Receipt ---------------- */}
      {receipt && (
        <div className="print-sheet flex flex-col gap-3">
          <div className="print-hide flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-success-text">
              <CheckCircle2 className="size-4" />
              Receipt {receipt.receiptNo} issued
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReceipt(null)}>
                Done
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="size-4" />
                Print receipt
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-2xl">
            <PaymentReceipt payment={receipt} school={identity} />
          </div>
        </div>
      )}
    </div>
  );
}
