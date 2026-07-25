"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Banknote,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Receipt,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import {
  getFeeSummary,
  paymentsApi,
  type FeeSummary,
  type Payment,
  type PaymentStatus,
} from "@/lib/api/feeLedger";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const quickLinks: { title: string; desc: string; href: string; icon: LucideIcon; gradient: string }[] = [
  { title: "Fee Structure", desc: "Define class-wise fee heads", href: "/fees/structure", icon: BookOpen, gradient: "gradient-indigo" },
  { title: "Collect Fee", desc: "Record new fee payments", href: "/fees/collect", icon: CreditCard, gradient: "gradient-emerald" },
  { title: "Receipts", desc: "Register, clearances & reversals", href: "/fees/receipts", icon: Receipt, gradient: "gradient-cyan" },
  { title: "Defaulters", desc: "Students with pending dues", href: "/fees/defaulters", icon: AlertTriangle, gradient: "gradient-rose" },
  { title: "Scholarships", desc: "Manage fee concessions", href: "/fees/scholarships", icon: Award, gradient: "gradient-violet" },
];

const statusStyle: Record<PaymentStatus, { icon: LucideIcon; tile: string; badge: "success" | "warning" | "danger" | "default" }> = {
  paid: { icon: CheckCircle, tile: "bg-success-soft text-success-text", badge: "success" },
  "pending-clearance": { icon: Clock, tile: "bg-warning-soft text-warning-text", badge: "warning" },
  cancelled: { icon: XCircle, tile: "bg-surface-hover text-muted", badge: "default" },
  bounced: { icon: XCircle, tile: "bg-danger-soft text-danger-text", badge: "danger" },
};

export default function FeesPage() {
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [recent, setRecent] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, payments] = await Promise.all([getFeeSummary(), paymentsApi.list()]);
        if (cancelled) return;
        setSummary(s);
        setRecent(payments.slice(0, 6));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load fee data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = summary
    ? [
        { label: "Collected today", value: inr.format(summary.collectedToday), sub: "Across all modes", icon: Banknote, gradient: "gradient-emerald" },
        { label: "Total collected", value: inr.format(summary.totalCollected), sub: `${summary.receipts} receipts`, icon: Wallet, gradient: "gradient-indigo" },
        { label: "Outstanding", value: inr.format(summary.outstanding), sub: `${summary.defaulters} defaulters`, icon: AlertTriangle, gradient: "gradient-rose" },
        { label: "Pending clearance", value: String(summary.pendingClearance), sub: "Cheques / DDs", icon: Clock, gradient: "gradient-amber" },
      ]
    : [];

  const byMode = summary ? Object.entries(summary.byMode).sort((a, b) => b[1] - a[1]) : [];
  const dayTotal = byMode.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Fee Management"
        description="Collections, dues and daily reconciliation"
        actions={
          <Link
            href="/fees/collect"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <DollarSign className="size-4" />
            Collect Fee
          </Link>
        }
      />

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
            <p className="text-xs text-muted">Check that the API server is running, then reload.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading || !summary
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
              : stats.map((s) => (
                  <Card key={s.label}>
                    <CardContent className="flex items-center gap-3.5">
                      <div className={`flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-sm ${s.gradient}`}>
                        <s.icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted">{s.label}</p>
                        <p className="mt-0.5 truncate text-xl font-semibold text-text">{s.value}</p>
                        <p className="mt-1 truncate text-[11px] text-subtle">{s.sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quickLinks.map((q) => (
              <Link key={q.href} href={q.href} className="focus-ring rounded-lg">
                <Card className="card-hover h-full">
                  <CardContent className="flex flex-col gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-sm ${q.gradient}`}>
                      <q.icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">{q.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{q.desc}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Open <ArrowRight className="size-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Day-book — today's collection by mode, the accountant's reconciliation view */}
            <Card>
              <CardHeader>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">Today&apos;s Collection</p>
                  <p className="mt-0.5 text-xs text-muted">Day-book by payment mode</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-text">{inr.format(dayTotal)}</span>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-32" />
                ) : byMode.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">No payments collected today yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {byMode.map(([mode, amount]) => {
                      const pct = dayTotal ? Math.round((amount / dayTotal) * 100) : 0;
                      return (
                        <div key={mode}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-text">{mode}</span>
                            <span className="text-muted">
                              {inr.format(amount)} · {pct}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-hover">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments — from the real register */}
            <Card>
              <CardHeader>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">Recent Payments</p>
                  <p className="mt-0.5 text-xs text-muted">Latest fee transactions</p>
                </div>
                <Link
                  href="/fees/receipts"
                  className="focus-ring shrink-0 rounded-sm text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  View all →
                </Link>
              </CardHeader>
              <div>
                {loading ? (
                  <div className="flex flex-col gap-2 p-4">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : recent.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-muted">No payments recorded yet.</p>
                ) : (
                  recent.map((p) => {
                    const st = statusStyle[p.status];
                    const Icon = st.icon;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0"
                      >
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${st.tile}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text">{p.studentName}</p>
                          <p className="mt-0.5 truncate text-xs text-subtle">
                            {p.receiptNo} · {p.date} · {p.method}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-text">{inr.format(p.amount)}</p>
                          <Badge variant={st.badge} className="mt-1">
                            {p.status === "pending-clearance" ? "pending" : p.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
