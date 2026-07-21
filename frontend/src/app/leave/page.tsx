"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Eye,
  Check,
  X,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";

const leaveRequests = [
  { id: "LV001", name: "Mr. Suresh Kumar",   role: "History Teacher",    type: "Sick Leave",    from: "14 Jul 2025", to: "16 Jul 2025", days: 3, reason: "Fever and cold",          status: "Pending",  dept: "Teaching" },
  { id: "LV002", name: "Ms. Kavita Joshi",   role: "Librarian",          type: "Casual Leave",  from: "18 Jul 2025", to: "18 Jul 2025", days: 1, reason: "Personal work",           status: "Approved", dept: "Library" },
  { id: "LV003", name: "Mr. Anil Kumar",     role: "Accountant",         type: "Earned Leave",  from: "21 Jul 2025", to: "25 Jul 2025", days: 5, reason: "Family function",         status: "Approved", dept: "Finance" },
  { id: "LV004", name: "Ms. Rekha Iyer",     role: "Counselor",          type: "Sick Leave",    from: "10 Jul 2025", to: "11 Jul 2025", days: 2, reason: "Medical checkup",         status: "Rejected", dept: "HR" },
  { id: "LV005", name: "Mr. Deepak Singh",   role: "Security Head",      type: "Casual Leave",  from: "20 Jul 2025", to: "20 Jul 2025", days: 1, reason: "Personal",               status: "Pending",  dept: "Security" },
  { id: "LV006", name: "Dr. Priya Sharma",   role: "Math Teacher",       type: "Maternity Leave",from:"01 Aug 2025", to: "30 Oct 2025", days: 90, reason: "Maternity",             status: "Approved", dept: "Teaching" },
  { id: "LV007", name: "Mr. Rahul Verma",    role: "Physics Teacher",    type: "Earned Leave",  from: "28 Jul 2025", to: "30 Jul 2025", days: 3, reason: "Vacation",               status: "Pending",  dept: "Teaching" },
  { id: "LV008", name: "Ms. Anita Gupta",    role: "Receptionist",       type: "Sick Leave",    from: "15 Jul 2025", to: "15 Jul 2025", days: 1, reason: "Not feeling well",        status: "Approved", dept: "Administration" },
  { id: "LV009", name: "Mr. Vinod Tiwari",   role: "Canteen Manager",    type: "Casual Leave",  from: "22 Jul 2025", to: "22 Jul 2025", days: 1, reason: "Personal work",           status: "Pending",  dept: "Canteen" },
  { id: "LV010", name: "Ms. Pooja Mehta",    role: "HR Manager",         type: "Earned Leave",  from: "04 Aug 2025", to: "08 Aug 2025", days: 5, reason: "Annual vacation",         status: "Approved", dept: "HR" },
];

const leaveBalance = [
  { name: "Dr. Priya Sharma",  dept: "Teaching",      sick: 12, casual: 12, earned: 15, used: 90, remaining: 0 },
  { name: "Mr. Rahul Verma",   dept: "Teaching",      sick: 10, casual: 11, earned: 12, used: 3,  remaining: 30 },
  { name: "Mr. Anil Kumar",    dept: "Finance",       sick: 12, casual: 12, earned: 10, used: 5,  remaining: 29 },
  { name: "Ms. Pooja Mehta",   dept: "HR",            sick: 12, casual: 12, earned: 10, used: 5,  remaining: 29 },
  { name: "Mr. Deepak Singh",  dept: "Security",      sick: 12, casual: 11, earned: 15, used: 1,  remaining: 37 },
  { name: "Ms. Kavita Joshi",  dept: "Library",       sick: 12, casual: 11, earned: 15, used: 1,  remaining: 37 },
];

type LeaveRequest = (typeof leaveRequests)[number];
type LeaveBalance = (typeof leaveBalance)[number];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const STATUS_META: Record<string, { variant: BadgeVariant; dot: string }> = {
  Pending: { variant: "warning", dot: "bg-warning" },
  Approved: { variant: "success", dot: "bg-success" },
  Rejected: { variant: "danger", dot: "bg-danger" },
};

const LEAVE_TYPE_VARIANT: Record<string, BadgeVariant> = {
  "Sick Leave": "danger",
  "Casual Leave": "info",
  "Earned Leave": "success",
  "Maternity Leave": "default",
};

const tabs = ["Requests", "Leave Balance"] as const;

/** Usage bands share the status palette: green under half, amber, then red. */
function usageTone(pct: number) {
  if (pct >= 80) return { bar: "bg-danger", text: "text-danger" };
  if (pct >= 50) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
}

export default function LeavePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Requests");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = leaveRequests.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.id.toLowerCase().includes(search.toLowerCase()) ||
      l.dept.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    const matchType = typeFilter === "All" || l.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const pending = leaveRequests.filter((l) => l.status === "Pending").length;
  const approved = leaveRequests.filter((l) => l.status === "Approved").length;
  const rejected = leaveRequests.filter((l) => l.status === "Rejected").length;
  const onLeave = leaveRequests
    .filter((l) => l.status === "Approved")
    .reduce((s, l) => s + (l.days <= 5 ? 1 : 0), 0);

  const requestColumns: Column<LeaveRequest>[] = [
    {
      key: "name",
      header: "Staff Member",
      sortable: true,
      render: (l) => (
        <div className="flex items-center gap-3">
          <Avatar name={l.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{l.name}</p>
            <p className="truncate text-xs text-subtle">{l.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Leave Type",
      sortable: true,
      render: (l) => (
        <Badge variant={LEAVE_TYPE_VARIANT[l.type] ?? "default"}>{l.type}</Badge>
      ),
    },
    {
      key: "from",
      header: "From",
      render: (l) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-muted">
          <CalendarDays className="size-3.5 text-subtle" />
          {l.from}
        </span>
      ),
    },
    {
      key: "to",
      header: "To",
      render: (l) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-muted">
          <CalendarDays className="size-3.5 text-subtle" />
          {l.to}
        </span>
      ),
    },
    {
      key: "days",
      header: "Days",
      sortable: true,
      align: "right",
      render: (l) => (
        <span className="inline-flex rounded-sm bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-text">
          {l.days}d
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (l) => <span className="block max-w-xs truncate text-muted">{l.reason}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (l) => <Badge variant={STATUS_META[l.status].variant}>{l.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          {l.status === "Pending" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 hover:bg-success-soft hover:text-success"
                aria-label={`Approve leave for ${l.name}`}
              >
                <Check className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 hover:bg-danger-soft hover:text-danger"
                aria-label={`Reject leave for ${l.name}`}
              >
                <X className="size-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              aria-label={`View leave request for ${l.name}`}
            >
              <Eye className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const balanceColumns: Column<LeaveBalance>[] = [
    {
      key: "name",
      header: "Staff Member",
      sortable: true,
      render: (b) => (
        <div className="flex items-center gap-3">
          <Avatar name={b.name} size="sm" />
          <p className="truncate font-medium text-text">{b.name}</p>
        </div>
      ),
    },
    {
      key: "dept",
      header: "Department",
      sortable: true,
      render: (b) => <Badge variant="info">{b.dept}</Badge>,
    },
    {
      key: "sick",
      header: "Sick Leave",
      sortable: true,
      align: "right",
      render: (b) => <span className="font-medium text-danger">{b.sick}</span>,
    },
    {
      key: "casual",
      header: "Casual Leave",
      sortable: true,
      align: "right",
      render: (b) => <span className="font-medium text-info">{b.casual}</span>,
    },
    {
      key: "earned",
      header: "Earned Leave",
      sortable: true,
      align: "right",
      render: (b) => <span className="font-medium text-success">{b.earned}</span>,
    },
    {
      key: "used",
      header: "Used",
      sortable: true,
      align: "right",
      render: (b) => <span className="font-semibold text-text">{b.used}</span>,
    },
    {
      key: "remaining",
      header: "Remaining",
      sortable: true,
      align: "right",
      render: (b) => <span className="font-semibold text-primary">{b.remaining}</span>,
    },
    {
      key: "usage",
      header: "Usage",
      render: (b) => {
        const total = b.sick + b.casual + b.earned;
        const pct = Math.min(Math.round((b.used / total) * 100), 100);
        const tone = usageTone(pct);
        return (
          <div className="flex min-w-36 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`w-8 text-right text-xs font-semibold ${tone.text}`}>{pct}%</span>
          </div>
        );
      },
    },
  ];

  const isRequests = tab === "Requests";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Leave Management"
        description="Track and manage staff leave requests"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Apply Leave
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={pending} icon={Clock} tone="amber" />
        <StatCard label="Approved" value={approved} icon={CheckCircle} tone="emerald" />
        <StatCard label="Rejected" value={rejected} icon={XCircle} tone="rose" />
        <StatCard label="On Leave Today" value={onLeave} icon={Users} tone="indigo" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Leave views"
          className="inline-flex gap-1 rounded-md bg-surface-sunken p-1"
        >
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setSearch("");
                setStatusFilter("All");
                setTypeFilter("All");
              }}
              className={`focus-ring rounded-sm px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t ? "bg-surface-raised text-text shadow-sm" : "text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isRequests && (
          <>
            <div className="min-w-60 flex-1">
              <Input
                type="search"
                placeholder="Search by name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="size-4" />}
                aria-label="Search leave requests"
              />
            </div>
            <div className="w-48">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { label: "All Types", value: "All" },
                  ...["Sick Leave", "Casual Leave", "Earned Leave", "Maternity Leave"].map((t) => ({
                    label: t,
                    value: t,
                  })),
                ]}
                aria-label="Filter by leave type"
              />
            </div>
            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: "All Status", value: "All" },
                  ...["Pending", "Approved", "Rejected"].map((s) => ({ label: s, value: s })),
                ]}
                aria-label="Filter by status"
              />
            </div>
            <p className="ml-auto text-xs text-subtle">{filtered.length} requests</p>
          </>
        )}
      </div>

      {isRequests ? (
        <Table
          columns={requestColumns}
          rows={filtered}
          rowKey={(l) => l.id}
          emptyTitle="No leave requests found"
          emptyDescription="Try adjusting your filters"
        />
      ) : (
        <Table
          columns={balanceColumns}
          rows={leaveBalance}
          rowKey={(b) => b.name}
          emptyTitle="No leave balances found"
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <p>
          {isRequests ? (
            <>
              <strong className="font-semibold text-text">{filtered.length}</strong> of{" "}
              <strong className="font-semibold text-text">{leaveRequests.length}</strong> requests
            </>
          ) : (
            <>
              <strong className="font-semibold text-text">{leaveBalance.length}</strong> staff
              members
            </>
          )}
        </p>
        {isRequests && (
          <div className="flex flex-wrap items-center gap-4">
            {["Pending", "Approved", "Rejected"].map((st) => {
              const count = filtered.filter((l) => l.status === st).length;
              return (
                <span key={st} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${STATUS_META[st].dot}`} />
                  {st}: <strong className="font-semibold text-text">{count}</strong>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
