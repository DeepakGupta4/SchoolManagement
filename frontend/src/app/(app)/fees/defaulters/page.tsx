"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Download, Search, Siren, Users, Wallet } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useAsyncList } from "@/hooks/useAsyncList";
import {
  feeAccountsApi,
  balanceOf,
  totalBilled,
  totalPaid,
  type StudentFeeAccount,
} from "@/lib/api/feeLedger";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Whole months between a date and today; 0 if never paid can't be computed. */
function monthsSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const now = new Date();
  const months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
  return Math.max(0, months);
}

/** Urgency is driven by the outstanding AMOUNT — a real, derivable signal. */
function urgency(due: number): { label: string; variant: "danger" | "warning" | "info"; tile: string } {
  if (due >= 15000) return { label: "Critical", variant: "danger", tile: "bg-danger-soft text-danger-text" };
  if (due >= 5000) return { label: "High", variant: "warning", tile: "bg-warning-soft text-warning-text" };
  return { label: "Medium", variant: "info", tile: "bg-info-soft text-info-text" };
}

const TIERS = ["All", "Critical", "High", "Medium"];

export default function DefaultersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("All");

  // Only accounts with an outstanding balance — the server computes standing.
  const fetcher = useCallback(() => feeAccountsApi.list({ search, standing: "due" }), [search]);
  const { items, loading, error, refetch } = useAsyncList<StudentFeeAccount>(fetcher);

  const rows = useMemo(() => {
    return items
      .map((a) => ({ account: a, due: balanceOf(a) }))
      .filter(({ due }) => due > 0)
      .filter(({ due }) => tier === "All" || urgency(due).label === tier)
      .sort((a, b) => b.due - a.due);
  }, [items, tier]);

  const stats = useMemo(() => {
    const withDue = items.map((a) => balanceOf(a)).filter((d) => d > 0);
    return {
      total: withDue.length,
      due: withDue.reduce((s, d) => s + d, 0),
      critical: withDue.filter((d) => d >= 15000).length,
      high: withDue.filter((d) => d >= 5000 && d < 15000).length,
    };
  }, [items]);

  const handleExport = () => {
    if (rows.length === 0) {
      toast({ title: "Nothing to export", description: "No defaulters match the filters.", variant: "warning" });
      return;
    }
    exportToCsv<(typeof rows)[number]>(
      "fee-defaulters",
      [
        { header: "Admission No", value: (r) => r.account.admissionNo },
        { header: "Name", value: (r) => r.account.name },
        { header: "Class", value: (r) => `${r.account.className} ${r.account.section}` },
        { header: "Guardian", value: (r) => r.account.guardian },
        { header: "Phone", value: (r) => r.account.guardianPhone },
        { header: "Billed (INR)", value: (r) => totalBilled(r.account) },
        { header: "Paid (INR)", value: (r) => totalPaid(r.account) },
        { header: "Due (INR)", value: (r) => r.due },
        { header: "Last Paid", value: (r) => r.account.lastPaymentDate ?? "Never" },
        { header: "Urgency", value: (r) => urgency(r.due).label },
      ],
      rows
    );
    toast({ title: "Export ready", description: `${rows.length} defaulters exported.` });
  };

  type Row = (typeof rows)[number];

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      sortValue: (r) => r.account.name,
      render: (r) => {
        const urg = urgency(r.due);
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", urg.tile)}>
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{r.account.name}</p>
              <p className="truncate text-xs text-subtle">{r.account.admissionNo}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "class",
      header: "Class",
      render: (r) => <Badge variant="info">{`${r.account.className} · ${r.account.section}`}</Badge>,
    },
    {
      key: "guardian",
      header: "Guardian",
      sortable: true,
      sortValue: (r) => r.account.guardian,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-muted">{r.account.guardian}</p>
          <p className="truncate text-xs text-subtle">{r.account.guardianPhone}</p>
        </div>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      sortable: true,
      sortValue: (r) => totalPaid(r.account),
      align: "right",
      render: (r) => (
        <span className="whitespace-nowrap font-medium text-success">
          {inr.format(totalPaid(r.account))}
        </span>
      ),
    },
    {
      key: "due",
      header: "Due",
      sortable: true,
      sortValue: (r) => r.due,
      align: "right",
      render: (r) => (
        <span className="whitespace-nowrap font-semibold text-danger">{inr.format(r.due)}</span>
      ),
    },
    {
      key: "lastPaid",
      header: "Last Paid",
      render: (r) => {
        const months = monthsSince(r.account.lastPaymentDate);
        return (
          <span className="whitespace-nowrap text-subtle">
            {r.account.lastPaymentDate
              ? `${r.account.lastPaymentDate}${months ? ` · ${months} mo. ago` : ""}`
              : "Never"}
          </span>
        );
      },
    },
    {
      key: "urgency",
      header: "Urgency",
      sortable: true,
      sortValue: (r) => r.due,
      render: (r) => {
        const urg = urgency(r.due);
        return <Badge variant={urg.variant}>{urg.label}</Badge>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Fee Defaulters"
        description="Students with an outstanding balance, derived live from the ledger."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total defaulters" value={stats.total} icon={Users} tone="rose" />
        <StatCard label="Total due" value={inr.format(stats.due)} icon={Wallet} tone="amber" />
        <StatCard label="Critical (≥ ₹15k)" value={stats.critical} icon={Siren} tone="rose" />
        <StatCard label="High (≥ ₹5k)" value={stats.high} icon={AlertTriangle} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              aria-pressed={tier === t}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                tier === t ? "bg-surface-raised text-text shadow-sm" : "text-muted hover:text-text"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, admission no. or guardian…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search defaulters"
          />
        </div>
        <p className="text-xs text-muted">{rows.length} students</p>
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
        <Table
          columns={columns}
          rows={rows}
          rowKey={(r) => r.account.id}
          loading={loading}
          emptyTitle="No defaulters found"
          emptyDescription="Every listed student has cleared their dues. 🎉"
        />
      )}
    </div>
  );
}
