"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  LogOut,
  Plus,
  Printer,
  Search,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";

const PAGE_SIZE = 10;

const requests = [
  { id: "TC-2026-001", tcNo: "TC/2026/0041", name: "Aarav Sharma",     studentId: "STU-0901", className: "9-A",  type: "transfer",   reason: "Parent relocation to Pune",        requestedOn: "2026-01-08", issuedOn: "2026-01-15", status: "issued",   dues: 0 },
  { id: "TC-2026-002", tcNo: "—",            name: "Diya Nair",        studentId: "STU-0902", className: "6-B",  type: "withdrawal", reason: "Shifting to state board school",   requestedOn: "2026-01-11", issuedOn: "—",          status: "pending",  dues: 4200 },
  { id: "TC-2026-003", tcNo: "TC/2026/0042", name: "Kabir Malhotra",   studentId: "STU-0903", className: "11-A", type: "transfer",   reason: "Father's job transfer to Chennai", requestedOn: "2026-01-12", issuedOn: "2026-01-19", status: "issued",   dues: 0 },
  { id: "TC-2026-004", tcNo: "—",            name: "Ananya Iyer",      studentId: "STU-0904", className: "4-A",  type: "withdrawal", reason: "Medical — long term treatment",    requestedOn: "2026-01-14", issuedOn: "—",          status: "approved", dues: 0 },
  { id: "TC-2026-005", tcNo: "—",            name: "Vivaan Reddy",     studentId: "STU-0905", className: "8-C",  type: "transfer",   reason: "Seeking residential school",       requestedOn: "2026-01-16", issuedOn: "—",          status: "rejected", dues: 9800 },
  { id: "TC-2026-006", tcNo: "TC/2026/0043", name: "Ishita Banerjee",  studentId: "STU-0906", className: "10-A", type: "transfer",   reason: "Family moving to Kolkata",         requestedOn: "2026-01-17", issuedOn: "2026-01-24", status: "issued",   dues: 0 },
  { id: "TC-2026-007", tcNo: "—",            name: "Reyansh Gupta",    studentId: "STU-0907", className: "2-B",  type: "withdrawal", reason: "Financial constraints",            requestedOn: "2026-01-19", issuedOn: "—",          status: "pending",  dues: 6500 },
  { id: "TC-2026-008", tcNo: "TC/2026/0044", name: "Saanvi Patil",     studentId: "STU-0908", className: "12-A", type: "transfer",   reason: "Admission in Navodaya Vidyalaya",  requestedOn: "2026-01-20", issuedOn: "2026-01-27", status: "issued",   dues: 0 },
  { id: "TC-2026-009", tcNo: "—",            name: "Arjun Chauhan",    studentId: "STU-0909", className: "7-A",  type: "transfer",   reason: "Relocation to Hyderabad",          requestedOn: "2026-01-22", issuedOn: "—",          status: "approved", dues: 0 },
  { id: "TC-2026-010", tcNo: "—",            name: "Myra Joshi",       studentId: "STU-0910", className: "5-B",  type: "withdrawal", reason: "Home schooling",                   requestedOn: "2026-01-23", issuedOn: "—",          status: "pending",  dues: 1500 },
  { id: "TC-2026-011", tcNo: "TC/2026/0045", name: "Advik Deshmukh",   studentId: "STU-0911", className: "9-B",  type: "transfer",   reason: "Parent posting to Nagpur",         requestedOn: "2026-01-25", issuedOn: "2026-02-01", status: "issued",   dues: 0 },
  { id: "TC-2026-012", tcNo: "—",            name: "Kiara Menon",      studentId: "STU-0912", className: "3-A",  type: "withdrawal", reason: "Moving abroad — Dubai",            requestedOn: "2026-01-27", issuedOn: "—",          status: "approved", dues: 0 },
  { id: "TC-2026-013", tcNo: "—",            name: "Atharv Rathore",   studentId: "STU-0913", className: "11-B", type: "transfer",   reason: "Change of stream to Commerce",     requestedOn: "2026-01-29", issuedOn: "—",          status: "rejected", dues: 0 },
  { id: "TC-2026-014", tcNo: "TC/2026/0046", name: "Aadhya Kulkarni",  studentId: "STU-0914", className: "6-A",  type: "transfer",   reason: "Family moving to Bengaluru",       requestedOn: "2026-02-02", issuedOn: "2026-02-09", status: "issued",   dues: 0 },
  { id: "TC-2026-015", tcNo: "—",            name: "Vihaan Saxena",    studentId: "STU-0915", className: "8-A",  type: "withdrawal", reason: "Personal / family reasons",        requestedOn: "2026-02-04", issuedOn: "—",          status: "pending",  dues: 3300 },
  { id: "TC-2026-016", tcNo: "—",            name: "Anika Bhatt",      studentId: "STU-0916", className: "10-B", type: "transfer",   reason: "Relocation to Jaipur",             requestedOn: "2026-02-06", issuedOn: "—",          status: "approved", dues: 0 },
];

type TransferRequest = (typeof requests)[number];

const STATUS_META: Record<
  string,
  { label: string; variant: "warning" | "info" | "success" | "danger" }
> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "info" },
  issued: { label: "TC Issued", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, m]) => ({
  label: m.label,
  value,
}));

const TYPE_OPTIONS = [
  { label: "Transfer", value: "transfer" },
  { label: "Withdrawal", value: "withdrawal" },
];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function TransfersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const query = search.trim().toLowerCase();
  const filtered = requests.filter((r) => {
    const matchSearch =
      !query ||
      r.name.toLowerCase().includes(query) ||
      r.studentId.toLowerCase().includes(query) ||
      r.tcNo.toLowerCase().includes(query) ||
      r.reason.toLowerCase().includes(query);
    return matchSearch && (!status || r.status === status) && (!type || r.type === type);
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const countOf = (s: string) => requests.filter((r) => r.status === s).length;
  const pendingDues = requests.reduce((sum, r) => sum + r.dues, 0);

  const columns: Column<TransferRequest>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{r.name}</p>
            <p className="truncate text-xs text-subtle">{r.studentId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "className",
      header: "Class",
      sortable: true,
      render: (r) => <Badge variant="info">{r.className}</Badge>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (r) => (
        <Badge variant={r.type === "transfer" ? "default" : "outline"} className="capitalize">
          {r.type}
        </Badge>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span className="text-muted">{r.reason}</span>,
    },
    {
      key: "requestedOn",
      header: "Requested",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap text-muted">{r.requestedOn}</span>,
    },
    {
      key: "tcNo",
      header: "TC Number",
      render: (r) =>
        r.tcNo === "—" ? (
          <span className="text-subtle">—</span>
        ) : (
          <span className="whitespace-nowrap font-medium text-text">{r.tcNo}</span>
        ),
    },
    {
      key: "issuedOn",
      header: "Issued On",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap text-subtle">{r.issuedOn}</span>,
    },
    {
      key: "dues",
      header: "Pending Dues",
      sortable: true,
      align: "right",
      render: (r) =>
        r.dues > 0 ? (
          <span className="whitespace-nowrap font-semibold text-danger">{inr.format(r.dues)}</span>
        ) : (
          <span className="whitespace-nowrap text-success">Cleared</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => {
        const meta = STATUS_META[r.status];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="View request"
            aria-label={`View request ${r.id}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <FileText className="size-4" />
          </button>
          <button
            title="Print transfer certificate"
            aria-label={`Print certificate for ${r.name}`}
            disabled={r.status !== "issued"}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text disabled:pointer-events-none disabled:opacity-40"
          >
            <Printer className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Transfers & Withdrawals"
        description="Manage transfer certificate requests, approvals and issuance."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              New Request
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Requests" value={requests.length} icon={LogOut} tone="indigo" />
        <StatCard label="Pending Approval" value={countOf("pending")} icon={Clock} tone="amber" />
        <StatCard label="TCs Issued" value={countOf("issued")} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Outstanding Dues" value={inr.format(pendingDues)} icon={XCircle} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by student, ID, TC number or reason…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search transfer requests"
          />
        </div>
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />
        </div>
        <div className="w-40">
          <Select
            value={type}
            onChange={(e) => applyFilter(setType)(e.target.value)}
            placeholder="All types"
            options={TYPE_OPTIONS}
            aria-label="Filter by request type"
          />
        </div>
        <p className="text-xs text-muted">{filtered.length} requests</p>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(r) => r.id}
        rowClassName={(r) => (r.status === "rejected" ? "opacity-60" : undefined)}
        emptyTitle="No requests found"
        emptyDescription="Try clearing your filters to see more results."
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}
