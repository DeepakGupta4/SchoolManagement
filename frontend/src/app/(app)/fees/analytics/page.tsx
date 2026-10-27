"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeIndianRupee, CircleDollarSign, Percent, RefreshCw, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  EmptyState,
  Loading,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { getFeeAnalytics, type FeeAnalytics } from "@/lib/api/feeLedger";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrShort = (n: number) =>
  n >= 1_00_000 ? `₹${(n / 1_00_000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${n}`;
const monthLabel = (m: string) => {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return Number.isNaN(d.getTime()) ? m : d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};
const rateTone = (r: number) =>
  r >= 85 ? "bg-success" : r >= 60 ? "bg-warning" : "bg-danger";

export default function FeeAnalyticsPage() {
  const [data, setData] = useState<FeeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      getFeeAnalytics()
        .then((d) => !cancelled && setData(d))
        .catch(() => !cancelled && setData(null))
        .finally(() => !cancelled && setLoading(false));
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [reloadKey]);

  const header = (
    <PageHeader
      title="Fee Analytics"
      description="Collection trends and billed-vs-collected across classes and fee heads."
      actions={
        <Button variant="ghost" onClick={reload} disabled={loading}>
          <RefreshCw className="size-4" /> Refresh
        </Button>
      }
    />
  );

  if (loading && !data) {
    return (
      <div className="space-y-6">
        {header}
        <Loading label="Crunching collection numbers…" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent>
            <EmptyState icon={<TrendingUp className="size-5" />} title="Analytics unavailable" description="Try again in a moment." />
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxMonthly = Math.max(1, ...data.monthly.map((m) => m.collected));

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Billed" value={inr.format(data.totals.billed)} icon={BadgeIndianRupee} tone="indigo" />
        <StatCard label="Collected" value={inr.format(data.totals.collected)} icon={CircleDollarSign} tone="emerald" />
        <StatCard label="Outstanding" value={inr.format(data.totals.outstanding)} icon={BadgeIndianRupee} tone="rose" />
        <StatCard label="Collection rate" value={`${data.totals.rate}%`} icon={Percent} tone="violet" />
      </div>

      {/* Monthly collection trend */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Monthly collection</h2>
        </CardHeader>
        <CardContent>
          {data.monthly.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No payments recorded yet.</p>
          ) : (
            <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ height: 180 }}>
              {data.monthly.map((m) => (
                <div key={m.month} className="flex min-w-10 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-semibold text-muted">{inrShort(m.collected)}</span>
                  <div
                    className="w-full rounded-t-md bg-primary"
                    style={{ height: `${Math.max(4, (m.collected / maxMonthly) * 140)}px` }}
                    title={`${monthLabel(m.month)}: ${inr.format(m.collected)}`}
                  />
                  <span className="text-[10px] text-subtle">{monthLabel(m.month)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* By class */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">By class</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byClass.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No data.</p>
            ) : (
              data.byClass.map((c) => (
                <div key={c.className}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-text">{c.className}</span>
                    <span className="text-muted">
                      {inrShort(c.collected)} / {inrShort(c.billed)} · {c.rate}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                    <div className={cn("h-full rounded-full", rateTone(c.rate))} style={{ width: `${c.rate}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* By head */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">By fee head</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byHead.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No data.</p>
            ) : (
              data.byHead.map((h) => (
                <div key={h.head}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-text">{h.head}</span>
                    <span className="text-muted">
                      {inrShort(h.collected)} / {inrShort(h.billed)} · {h.rate}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                    <div className={cn("h-full rounded-full", rateTone(h.rate))} style={{ width: `${h.rate}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
