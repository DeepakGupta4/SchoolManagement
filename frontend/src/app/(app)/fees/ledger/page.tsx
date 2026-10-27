"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Scale, Wallet } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Loading,
  PageHeader,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { getLedger, type LedgerEntry, type LedgerResult } from "@/lib/api/feeLedger";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function FeeLedgerPage() {
  const [data, setData] = useState<LedgerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      getLedger({ from: from || undefined, to: to || undefined })
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {
          if (!cancelled) setData(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [from, to, reloadKey]);

  const columns: Column<LedgerEntry & { _i: number }>[] = [
    { key: "date", header: "Date", render: (e) => <span className="whitespace-nowrap text-muted">{fmtDate(e.date)}</span> },
    {
      key: "type",
      header: "Type",
      render: (e) =>
        e.type === "income" ? (
          <Badge variant="success"><ArrowDownCircle className="mr-1 size-3" /> Income</Badge>
        ) : (
          <Badge variant="danger"><ArrowUpCircle className="mr-1 size-3" /> Expense</Badge>
        ),
    },
    { key: "label", header: "Particulars", render: (e) => <span className="font-medium text-text">{e.label}</span> },
    { key: "ref", header: "Ref", render: (e) => <span className="text-xs text-subtle">{e.ref || "—"}</span> },
    { key: "method", header: "Mode", render: (e) => <span className="text-xs text-muted">{e.method || "—"}</span> },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (e) => (
        <span className={e.type === "income" ? "font-semibold text-success-text" : "font-semibold text-danger-text"}>
          {e.type === "income" ? "+" : "−"}
          {inr.format(e.amount)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (e) => <span className="font-mono text-sm text-text">{inr.format(e.balance)}</span>,
    },
  ];

  const header = (
    <PageHeader
      title="Accounting Ledger"
      description="Every rupee in (fees) and out (expenses), in one running cash book."
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
        <Loading label="Loading the ledger…" />
      </div>
    );
  }

  const rows = (data?.entries ?? []).map((e, _i) => ({ ...e, _i }));

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total income" value={inr.format(data?.totals.income ?? 0)} icon={ArrowDownCircle} tone="emerald" />
        <StatCard label="Total expense" value={inr.format(data?.totals.expense ?? 0)} icon={ArrowUpCircle} tone="rose" />
        <StatCard
          label="Net balance"
          value={inr.format(data?.totals.net ?? 0)}
          icon={Scale}
          tone="indigo"
          sub={
            (from || to) && data?.totals.opening
              ? `${inr.format(data.totals.opening)} carried in`
              : undefined
          }
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted">
            From
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
          </label>
          <label className="text-xs text-muted">
            To
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </label>
          {(from || to) && (
            <Button variant="outline" size="sm" onClick={() => { setFrom(""); setTo(""); }}>
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Wallet className="size-5" />}
              title="No entries in this period"
              description="Collected fees and recorded expenses will appear here as a running cash book."
            />
          </CardContent>
        </Card>
      ) : (
        <Table columns={columns} rows={rows} rowKey={(e) => `${e.type}-${e.ref}-${e._i}`} />
      )}
    </div>
  );
}
