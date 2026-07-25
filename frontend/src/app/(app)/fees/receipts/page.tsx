"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle,
  Clock,
  Download,
  RotateCcw,
  Receipt as ReceiptIcon,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  Pagination,
  StatCard,
  Table,
  Textarea,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useAsyncList } from "@/hooks/useAsyncList";
import {
  paymentsApi,
  clearPayment,
  bouncePayment,
  cancelPayment,
  type Payment,
  type PaymentStatus,
} from "@/lib/api/feeLedger";

const statusConfig: Record<
  PaymentStatus,
  { variant: "success" | "warning" | "danger" | "default"; icon: React.ElementType; label: string }
> = {
  paid: { variant: "success", icon: CheckCircle, label: "Paid" },
  "pending-clearance": { variant: "warning", icon: Clock, label: "Pending clearance" },
  cancelled: { variant: "default", icon: XCircle, label: "Cancelled" },
  bounced: { variant: "danger", icon: Ban, label: "Bounced" },
};

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending-clearance" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Bounced", value: "bounced" },
];

const PAGE_SIZE = 8;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** A reversal (bounce/cancel) needs a typed reason before it fires. */
type Reversal = { payment: Payment; kind: "bounce" | "cancel" };

export default function ReceiptsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetcher = useCallback(() => paymentsApi.list({ search, status }), [search, status]);
  const { items, loading, error, refetch } = useAsyncList<Payment>(fetcher);

  const [reversal, setReversal] = useState<Reversal | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const applyFilter = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  // Money totals exclude reversed receipts — a cancelled or bounced payment
  // never counts as collected.
  const stats = useMemo(() => {
    const live = items.filter((p) => p.status === "paid" || p.status === "pending-clearance");
    return {
      total: items.length,
      collected: live.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
      pending: items.filter((p) => p.status === "pending-clearance").length,
      reversed: items.filter((p) => p.status === "cancelled" || p.status === "bounced").length,
    };
  }, [items]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const clear = async (p: Payment) => {
    try {
      await clearPayment(p.id);
      toast({ title: "Cheque cleared", description: `${p.receiptNo} marked as realised.` });
      refetch();
    } catch (e) {
      toast({
        title: "Could not clear",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  const confirmReversal = async () => {
    if (!reversal) return;
    setBusy(true);
    try {
      const fn = reversal.kind === "bounce" ? bouncePayment : cancelPayment;
      await fn(reversal.payment.id, reason.trim());
      toast({
        title: reversal.kind === "bounce" ? "Cheque bounced" : "Receipt cancelled",
        description: `${reversal.payment.receiptNo} reversed — the amount is back on the ledger.`,
      });
      setReversal(null);
      setReason("");
      refetch();
    } catch (e) {
      toast({
        title: "Could not reverse",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      toast({ title: "Nothing to export", description: "No receipts match the filters.", variant: "warning" });
      return;
    }
    exportToCsv<Payment>(
      "fee-receipts",
      [
        { header: "Receipt No", value: (r) => r.receiptNo },
        { header: "Student", value: (r) => r.studentName },
        { header: "Class", value: (r) => r.className },
        { header: "Amount (INR)", value: (r) => r.amount },
        { header: "Method", value: (r) => r.method },
        { header: "Reference", value: (r) => r.reference },
        { header: "Date", value: (r) => r.date },
        { header: "Status", value: (r) => statusConfig[r.status].label },
        { header: "Collected By", value: (r) => r.collectedBy },
        { header: "Reversal Reason", value: (r) => r.reversalReason ?? "" },
      ],
      items
    );
    toast({ title: "Export ready", description: `${items.length} receipts exported.` });
  };

  const columns: Column<Payment>[] = [
    {
      key: "receiptNo",
      header: "Receipt",
      sortable: true,
      render: (r) => <span className="font-semibold text-primary">{r.receiptNo}</span>,
    },
    {
      key: "studentName",
      header: "Student",
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{r.studentName}</p>
          <p className="truncate text-xs text-subtle">{r.className}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (r) => (
        <span
          className={cn(
            "whitespace-nowrap font-semibold",
            r.status === "cancelled" || r.status === "bounced"
              ? "text-subtle line-through"
              : "text-text"
          )}
        >
          {inr.format(r.amount)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (r) => (
        <div className="min-w-0">
          <p className="text-muted">{r.method}</p>
          {r.reference && <p className="truncate font-mono text-[11px] text-subtle">{r.reference}</p>}
        </div>
      ),
    },
    { key: "date", header: "Date", sortable: true, render: (r) => <span className="whitespace-nowrap text-muted">{r.date}</span> },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => {
        const sc = statusConfig[r.status];
        const Icon = sc.icon;
        return (
          <div className="min-w-0">
            <Badge variant={sc.variant} className="gap-1.5">
              <Icon className="size-3" />
              {sc.label}
            </Badge>
            {r.reversalReason && (
              <p className="mt-0.5 truncate text-[11px] text-subtle" title={r.reversalReason}>
                {r.reversalReason}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => {
        const reversed = r.status === "cancelled" || r.status === "bounced";
        return (
          <div className="flex items-center justify-end gap-1">
            {r.status === "pending-clearance" && (
              <>
                <button
                  onClick={() => clear(r)}
                  title="Mark cheque/DD as cleared"
                  aria-label={`Clear ${r.receiptNo}`}
                  className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-success-soft hover:text-success-text"
                >
                  <CheckCircle className="size-4" />
                </button>
                <button
                  onClick={() => setReversal({ payment: r, kind: "bounce" })}
                  title="Mark as bounced"
                  aria-label={`Bounce ${r.receiptNo}`}
                  className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Ban className="size-4" />
                </button>
              </>
            )}
            {!reversed && (
              <button
                onClick={() => setReversal({ payment: r, kind: "cancel" })}
                title="Cancel receipt"
                aria-label={`Cancel ${r.receiptNo}`}
                className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
            {reversed && <span className="pr-1 text-xs text-subtle">—</span>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Fee Receipts"
        description="Payment register — clear cheques, reverse mistakes, export."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export All
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total receipts" value={stats.total} icon={ReceiptIcon} tone="indigo" />
        <StatCard label="Collected" value={inr.format(stats.collected)} icon={Wallet} tone="emerald" />
        <StatCard label="Pending clearance" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="Reversed" value={stats.reversed} icon={XCircle} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-md bg-surface-sunken p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => applyFilter(setStatus)(tab.value)}
              aria-pressed={status === tab.value}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                status === tab.value
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by student, receipt no. or reference…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search receipts"
          />
        </div>
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
        <>
          <Table
            columns={columns}
            rows={paged}
            rowKey={(r) => r.id}
            loading={loading}
            emptyTitle="No receipts found"
            emptyDescription="Collected payments will appear here."
          />
          {!loading && (
            <Pagination
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={items.length}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Reversal reason dialog — bounce and cancel both require a reason */}
      <ConfirmDialog
        open={Boolean(reversal)}
        onOpenChange={(open) => {
          if (!open) {
            setReversal(null);
            setReason("");
          }
        }}
        title={reversal?.kind === "bounce" ? "Mark cheque as bounced?" : "Cancel this receipt?"}
        description={
          reversal
            ? `${reversal.payment.receiptNo} for ${reversal.payment.studentName} (${inr.format(
                reversal.payment.amount
              )}) will be reversed and the amount returned to the student's ledger. This cannot be undone.`
            : ""
        }
        confirmLabel={reversal?.kind === "bounce" ? "Mark bounced" : "Cancel receipt"}
        destructive
        loading={busy}
        confirmDisabled={reason.trim().length < 3}
        onConfirm={confirmReversal}
      >
        <Textarea
          label="Reason"
          required
          placeholder="e.g. Cheque returned — insufficient funds"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={reason.trim().length > 0 && reason.trim().length < 3 ? "Too short" : undefined}
        />
      </ConfirmDialog>
    </div>
  );
}
