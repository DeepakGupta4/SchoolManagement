"use client";

import { useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CheckCircle2,
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
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  autoAllocate,
  balanceOf,
  CLASS_OPTIONS,
  CLEARS_LATER,
  collectPayment,
  feeAccountsApi,
  headBalance,
  isCleared,
  PAYMENT_METHODS,
  REFERENCE_LABEL,
  REFERENCE_REQUIRED,
  totalBilled,
  totalPaid,
  type PaymentAllocation,
  type PaymentMethod,
  type Payment,
  type StudentFeeAccount,
} from "@/lib/api/feeLedger";
import { PaymentReceipt } from "./PaymentReceipt";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Quick amounts a clerk reaches for before typing a custom figure. */
const QUICK_PRESETS = [
  { label: "Full balance", of: (b: number) => b },
  { label: "Half", of: (b: number) => Math.round(b / 2) },
  { label: "₹5,000", of: () => 5000 },
  { label: "₹2,000", of: () => 2000 },
];

export default function CollectFeePage() {
  const { toast } = useToast();
  const collector = useAuthStore((s) => s.user?.name ?? "Front Desk");

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [standing, setStanding] = useState("due");

  const filters = useMemo(() => ({ search, className, standing }), [search, className, standing]);
  const filterKey = JSON.stringify(filters);
  const fetcher = useMemo(
    () => () => feeAccountsApi.list(JSON.parse(filterKey)),
    [filterKey]
  );
  const { items: accounts, loading, error, refetch } = useAsyncList<StudentFeeAccount>(fetcher);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  // Per-head amounts the clerk is collecting right now, keyed by head name.
  const [entered, setEntered] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [reference, setReference] = useState("");
  const [bank, setBank] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);

  const balance = selected ? balanceOf(selected) : 0;

  const allocations: PaymentAllocation[] = useMemo(() => {
    if (!selected) return [];
    return Object.entries(entered)
      .map(([head, value]) => ({ head, amount: Math.max(0, Math.round(Number(value) || 0)) }))
      .filter((a) => a.amount > 0);
  }, [entered, selected]);

  const collecting = allocations.reduce((sum, a) => sum + a.amount, 0);
  const overpaying = collecting > balance;
  const referenceMissing = REFERENCE_REQUIRED.includes(method) && !reference.trim();
  const canSubmit = Boolean(selected) && collecting > 0 && !overpaying && !referenceMissing;

  const pickStudent = (account: StudentFeeAccount) => {
    setSelectedId(account.id);
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
                options={CLASS_OPTIONS.map((c) => ({ label: c, value: c }))}
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
                const active = a.id === selectedId;
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
                  <p className="text-base font-semibold text-text">{selected.name}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {selected.admissionNo} · {selected.className} {selected.section} · Roll{" "}
                    {selected.rollNo}
                  </p>
                  <p className="mt-0.5 text-xs text-subtle">
                    Guardian: {selected.guardian} · {selected.guardianPhone}
                  </p>
                </div>
                <div className="flex gap-6">
                  {[
                    { label: "Billed", value: totalBilled(selected), tone: "text-text" },
                    { label: "Paid", value: totalPaid(selected), tone: "text-success" },
                    { label: "Balance", value: balance, tone: balance > 0 ? "text-danger" : "text-success" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-xs text-subtle">{s.label}</p>
                      <p className={cn("mt-0.5 text-lg font-semibold", s.tone)}>{inr(s.value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isCleared(selected) ? (
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
                        Part payments are allowed — enter any amount up to the balance.
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
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
                                <td className="px-4 py-2.5 font-medium text-text">{h.head}</td>
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
                                </td>
                              </tr>
                            );
                          })}

                          {selected.lateFee > 0 && (
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
                                  value={entered["Late Fee"] ?? ""}
                                  onChange={(e) => setHead("Late Fee", e.target.value)}
                                  aria-label="Amount for late fee"
                                  className="text-right"
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
                      <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                        <BadgeIndianRupee className="size-4" />
                        {submitting ? "Recording…" : `Collect ${inr(collecting)}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
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
            <PaymentReceipt payment={receipt} />
          </div>
        </div>
      )}
    </div>
  );
}
