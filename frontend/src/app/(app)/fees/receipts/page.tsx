"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  Clock,
  Download,
  Eye,
  Printer,
  Receipt as ReceiptIcon,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Input,
  PageHeader,
  Pagination,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { FEE_RECEIPTS as receipts, type FeeReceipt } from "@/lib/api/feeRecords";


type ReceiptRow = FeeReceipt;

const statusConfig: Record<
  string,
  { variant: "success" | "warning" | "danger"; icon: React.ElementType; label: string }
> = {
  paid: { variant: "success", icon: CheckCircle, label: "Paid" },
  pending: { variant: "warning", icon: Clock, label: "Pending" },
  cancelled: { variant: "danger", icon: XCircle, label: "Cancelled" },
};

const tabs = ["All", "Paid", "Pending", "Cancelled"];

const PAGE_SIZE = 8;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ReceiptsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const filtered = receipts.filter((r) => {
    const matchTab = activeTab === "All" || r.status === activeTab.toLowerCase();
    const matchSearch =
      r.student.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.feeType.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // A narrowed filter can strand you past the last page, so clamp during render.
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalCollected = receipts
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.amount, 0);

  /** "Export All" covers every filtered receipt, not just the visible page. */
  const handleExport = () => {
    if (filtered.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No receipts match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<ReceiptRow>(
      "fee-receipts",
      [
        { header: "Receipt No", value: (r) => r.id },
        { header: "Student", value: (r) => r.student },
        { header: "Class", value: (r) => r.class },
        { header: "Fee Type", value: (r) => r.feeType },
        { header: "Amount (INR)", value: (r) => r.amount },
        { header: "Method", value: (r) => r.method },
        { header: "Date", value: (r) => r.date },
        { header: "Status", value: (r) => statusConfig[r.status]?.label ?? r.status },
        { header: "Transaction ID", value: (r) => r.txnId },
      ],
      filtered
    );
    toast({
      title: "Export ready",
      description: `${filtered.length} receipt${filtered.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const columns: Column<ReceiptRow>[] = [
    {
      key: "id",
      header: "Receipt ID",
      sortable: true,
      render: (r) => <span className="font-semibold text-primary">{r.id}</span>,
    },
    {
      key: "student",
      header: "Student",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap font-medium text-text">{r.student}</span>,
    },
    {
      key: "class",
      header: "Class",
      render: (r) => <Badge variant="info">{r.class}</Badge>,
    },
    {
      key: "feeType",
      header: "Fee Type",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap text-muted">{r.feeType}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (r) => (
        <span className="whitespace-nowrap font-semibold text-text">{inr.format(r.amount)}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (r) => <span className="text-muted">{r.method}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap text-muted">{r.date}</span>,
    },
    {
      key: "txnId",
      header: "Txn ID",
      render: (r) => <span className="font-mono text-xs text-subtle">{r.txnId}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => {
        const sc = statusConfig[r.status];
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1.5">
            <StatusIcon className="size-3" />
            {sc.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {[
            { Icon: Eye, label: "View" },
            { Icon: Printer, label: "Print" },
            { Icon: Download, label: "Download" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              title={label}
              aria-label={`${label} receipt ${r.id}`}
              className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Fee Receipts"
        description="View, print and download fee receipts"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export All
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Receipts" value={receipts.length} icon={ReceiptIcon} tone="indigo" />
        <StatCard label="Total Collected" value={inr.format(totalCollected)} icon={Wallet} tone="emerald" />
        <StatCard
          label="Pending"
          value={receipts.filter((r) => r.status === "pending").length}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Cancelled"
          value={receipts.filter((r) => r.status === "cancelled").length}
          icon={XCircle}
          tone="rose"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              aria-pressed={activeTab === tab}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search receipts…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={<Search className="size-4" />}
            aria-label="Search receipts"
          />
        </div>
        <p className="text-xs text-muted">{filtered.length} receipts</p>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(r) => r.id}
        emptyTitle="No receipts found"
        emptyDescription="Try adjusting your filters to see more results."
      />

      <Pagination
        page={safePage}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}
