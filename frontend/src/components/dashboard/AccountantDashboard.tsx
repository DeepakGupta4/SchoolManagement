"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet, Landmark, AlertTriangle, UserX, Hourglass, Receipt, Coins, Banknote,
  Smartphone, CreditCard, FileText, ScrollText, ClipboardList, Inbox, Zap,
  HandCoins, CircleDollarSign, ArrowRight,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  getFeeSummary, paymentsApi, PAYMENT_METHODS,
  type FeeSummary, type Payment, type PaymentMethod,
} from "@/lib/api/feeLedger";
import { expensesApi, expenseMonthBucket } from "@/lib/api/expenses";
import { todayIso } from "@/lib/dates";
import { useEntitlementsStore } from "@/store";
import { hrefInTier } from "@/lib/permissions";

/** All money is whole-rupee INR, the house style for the fee desk. */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * A source that failed shows an em dash — never a confident ₹0, which would
 * read as "nothing collected" rather than "couldn't load".
 */
const money = (n: number | null | undefined) => (typeof n === "number" ? inr.format(n) : "—");
const count = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("en-IN") : "—");

/** Day + short month for a receipt date. Built from the y-m-d prefix in LOCAL
 *  time so no UTC offset shifts the calendar day; deterministic, safe in render. */
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });
function fmtDate(iso: string): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

/** A small, neutral icon per payment instrument for the by-mode breakdown. */
const MODE_ICON: Record<PaymentMethod, typeof Wallet> = {
  Cash: Banknote,
  UPI: Smartphone,
  Card: CreditCard,
  Cheque: FileText,
  "Bank Transfer": Landmark,
  DD: ScrollText,
};

const QUICK_ACTIONS = [
  { href: "/fees/collect", icon: HandCoins, title: "Collect fee", desc: "Record a new payment" },
  { href: "/fees/defaulters", icon: CircleDollarSign, title: "Fee dues", desc: "Students with outstanding fees" },
  { href: "/fees/receipts", icon: Receipt, title: "Receipts", desc: "Payment register & reprints" },
  { href: "/expenses", icon: FileText, title: "Expenses", desc: "Vouchers & spending" },
  { href: "/payroll", icon: Banknote, title: "Payroll", desc: "Salary runs & payslips" },
];

function StatCard({
  icon: Icon, label, value, tone, sub,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", tone)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-0.5 text-lg font-bold leading-tight text-text break-words">{value}</p>
          {sub && <p className="mt-0.5 truncate text-[11px] text-subtle">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountantDashboard() {
  // Hide quick-actions whose module isn't in the school's plan (Expenses/Payroll
  // are Premium) so a card never links to a page the plan can't open.
  const tierModules = useEntitlementsStore((s) => s.tierModules);
  const quickActions = QUICK_ACTIONS.filter((a) => hrefInTier(a.href, tierModules));
  // undefined = still loading; null = that source failed; value = loaded.
  const [summary, setSummary] = useState<FeeSummary | null | undefined>(undefined);
  const [payments, setPayments] = useState<Payment[] | null | undefined>(undefined);
  const [monthExpense, setMonthExpense] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // allSettled so one dead endpoint can't blank the whole day-book.
    Promise.allSettled([getFeeSummary(), paymentsApi.list(), expensesApi.list()]).then(
      ([s, p, e]) => {
        if (cancelled) return;
        setSummary(s.status === "fulfilled" ? s.value : null);
        setPayments(p.status === "fulfilled" ? p.value : null);
        if (e.status === "fulfilled") {
          const monthKey = todayIso().slice(0, 7); // yyyy-mm
          const total = e.value
            .filter((x) => expenseMonthBucket(x.date)?.key === monthKey)
            .reduce((sum, x) => sum + (x.amount ?? 0), 0);
          setMonthExpense(total);
        } else {
          setMonthExpense(null);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (summary === undefined) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px]" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const modeRows = summary
    ? PAYMENT_METHODS.map((m) => ({ mode: m, amount: summary.byMode?.[m] ?? 0 })).filter((r) => r.amount > 0)
    : [];

  const recent =
    payments && payments.length
      ? [...payments].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 8)
      : [];

  return (
    <div className="flex flex-col gap-5">
      {/* Day-book KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Collected today"
          value={money(summary?.collectedToday)}
          tone="bg-success-soft text-success-text"
          sub="So far today"
        />
        <StatCard
          icon={Landmark}
          label="Total collected"
          value={money(summary?.totalCollected)}
          tone="bg-primary-soft text-primary-text"
          sub={summary ? `${count(summary.receipts)} receipts` : "All-time"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Outstanding dues"
          value={money(summary?.outstanding)}
          tone="bg-warning-soft text-warning-text"
          sub={summary ? `${count(summary.accounts)} fee accounts` : undefined}
        />
        <StatCard
          icon={UserX}
          label="Defaulters"
          value={count(summary?.defaulters)}
          tone="bg-danger-soft text-danger-text"
          sub="Students with dues"
        />
        <StatCard
          icon={Hourglass}
          label="Pending clearance"
          value={count(summary?.pendingClearance)}
          tone="bg-info-soft text-info-text"
          sub="Cheques & DDs"
        />
        <StatCard
          icon={Receipt}
          label="Expenses"
          value={money(monthExpense)}
          tone="bg-surface-hover text-subtle"
          sub="This month"
        />
      </div>

      {summary === null && (
        <p className="-mt-1 text-xs text-muted">
          Live fee figures couldn&rsquo;t be loaded right now &mdash; showing &ldquo;&mdash;&rdquo; instead of a
          misleading zero. Try refreshing in a moment.
        </p>
      )}

      {/* Today's collection, split by instrument */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-text">Today&rsquo;s collection by mode</h2>
            </div>
          </CardHeader>
          <CardContent>
            {modeRows.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No collection recorded today yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {modeRows.map(({ mode, amount }) => {
                  const Icon = MODE_ICON[mode];
                  return (
                    <div key={mode} className="rounded-lg bg-surface-sunken px-3 py-2.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-subtle">
                        <Icon className="size-3" />
                        {mode}
                      </p>
                      <p className="mt-0.5 text-base font-bold leading-none text-text">{inr.format(amount)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent payments register */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-text">Recent payments</h2>
            {payments && payments.length > 0 && <span className="text-xs text-muted">· {recent.length}</span>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {payments === null ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-5 text-subtle" />
              <p className="text-sm text-muted">Payments couldn&rsquo;t be loaded right now.</p>
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-5 text-subtle" />
              <p className="text-sm text-muted">No payments recorded yet.</p>
            </div>
          ) : (
            recent.map((p) => {
              const voided = p.status === "cancelled" || p.status === "bounced";
              return (
                <div key={p.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                    <Receipt className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{p.studentName || "—"}</p>
                    <p className="truncate text-xs text-muted">
                      {p.receiptNo}
                      {p.className ? ` · ${p.className}` : ""}
                      {p.method ? ` · ${p.method}` : ""}
                    </p>
                  </div>
                  {p.status !== "paid" && (
                    <Badge
                      variant={
                        p.status === "bounced" ? "danger" : p.status === "pending-clearance" ? "warning" : "default"
                      }
                    >
                      {p.status === "pending-clearance" ? "Pending" : p.status === "bounced" ? "Bounced" : "Cancelled"}
                    </Badge>
                  )}
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        voided ? "text-muted line-through" : "text-text"
                      )}
                    >
                      {inr.format(p.amount)}
                    </p>
                    <p className="text-[11px] text-subtle">{fmtDate(p.date)}</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">Quick actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href} className="focus-ring group">
                <Card className="card-hover h-full">
                  <CardContent className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text">{a.title}</p>
                      <p className="truncate text-xs text-muted">{a.desc}</p>
                    </div>
                    <ArrowRight className="size-4 text-subtle transition-colors group-hover:text-primary" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
