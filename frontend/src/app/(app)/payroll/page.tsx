"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Search,
  Send,
  Users,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { useChartTheme } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { PayslipModal, type PayrollEmployee } from "./PayslipModal";
import { useResource } from "@/hooks/useResource";
import { payrollApi, type PayrollRecord } from "@/lib/api/payroll";

type Employee = PayrollRecord;

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const deptVariant: Record<string, BadgeVariant> = {
  Mathematics: "info",
  Physics: "default",
  English: "success",
  History: "warning",
  Chemistry: "default",
  "Computer Science": "info",
  Biology: "success",
  "Physical Education": "danger",
  Administration: "default",
  Finance: "warning",
  Library: "default",
  Operations: "default",
};

const statusConfig: Record<
  string,
  { variant: BadgeVariant; icon: React.ElementType; label: string }
> = {
  paid: { variant: "success", icon: CheckCircle, label: "Paid" },
  pending: { variant: "warning", icon: Clock, label: "Pending" },
  "on-hold": { variant: "danger", icon: AlertCircle, label: "On Hold" },
};

const monthlyPayroll = [
  { month: "Feb", amount: 820000 },
  { month: "Mar", amount: 835000 },
  { month: "Apr", amount: 828000 },
  { month: "May", amount: 842000 },
  { month: "Jun", amount: 838000 },
  { month: "Jul", amount: 855000 },
];

const tabs = ["All", "Paid", "Pending", "On Hold"];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function PayrollPage() {
  const t = useChartTheme();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [payslipFor, setPayslipFor] = useState<PayrollEmployee | null>(null);
  const { toast } = useToast();
  const { items, loading } = useResource(payrollApi, {}, { label: "employee" });

  /** One employee's row exported as their payslip line. */
  const downloadSlip = (emp: PayrollEmployee) => {
    exportToCsv<PayrollEmployee>(
      `payslip-${emp.id}`,
      [
        { header: "Employee ID", value: (e) => e.employeeId },
        { header: "Name", value: (e) => e.name },
        { header: "Designation", value: (e) => e.role },
        { header: "Department", value: (e) => e.dept },
        { header: "Basic", value: (e) => e.basic },
        { header: "HRA", value: (e) => e.hra },
        { header: "TA", value: (e) => e.ta },
        { header: "Deductions", value: (e) => e.deductions },
        { header: "Net Pay", value: (e) => e.net },
        { header: "Bank", value: (e) => e.bank },
        { header: "Status", value: (e) => e.status },
      ],
      [emp]
    );
    toast({ title: "Payslip downloaded", description: `${emp.name}'s salary slip exported.` });
  };

  const filtered = items.filter((e) => {
    const tabVal = activeTab === "On Hold" ? "on-hold" : activeTab.toLowerCase();
    const matchTab = activeTab === "All" || e.status === tabVal;
    const matchRole = roleFilter === "All" || e.role === roleFilter;
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.dept.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchRole && matchSearch;
  });

  const totalNet = items.reduce((s, e) => s + e.net, 0);
  const totalPaid = items.filter((e) => e.status === "paid").reduce((s, e) => s + e.net, 0);
  const totalPending = items
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + e.net, 0);
  const roles = ["All", ...Array.from(new Set(items.map((e) => e.role)))];

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No payroll records match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Employee>(
      "payroll",
      [
        { header: "Employee ID", value: (e) => e.employeeId },
        { header: "Name", value: (e) => e.name },
        { header: "Role", value: (e) => e.role },
        { header: "Department", value: (e) => e.dept },
        { header: "Basic (INR)", value: (e) => e.basic },
        { header: "HRA (INR)", value: (e) => e.hra },
        { header: "TA (INR)", value: (e) => e.ta },
        { header: "Deductions (INR)", value: (e) => e.deductions },
        { header: "Net Pay (INR)", value: (e) => e.net },
        { header: "Bank", value: (e) => e.bank },
        { header: "Status", value: (e) => e.status },
      ],
      filtered
    );
    toast({
      title: "Export ready",
      description: `${filtered.length} payroll record${filtered.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar name={emp.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{emp.name}</p>
            <p className="truncate text-xs text-subtle">{emp.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (emp) => <span className="whitespace-nowrap text-muted">{emp.role}</span>,
    },
    {
      key: "dept",
      header: "Department",
      sortable: true,
      render: (emp) => <Badge variant={deptVariant[emp.dept] ?? "default"}>{emp.dept}</Badge>,
    },
    {
      key: "basic",
      header: "Basic",
      sortable: true,
      align: "right",
      render: (emp) => <span className="whitespace-nowrap text-muted">{inr.format(emp.basic)}</span>,
    },
    {
      key: "hra",
      header: "HRA",
      sortable: true,
      align: "right",
      render: (emp) => <span className="whitespace-nowrap text-muted">{inr.format(emp.hra)}</span>,
    },
    {
      key: "ta",
      header: "TA",
      sortable: true,
      align: "right",
      render: (emp) => <span className="whitespace-nowrap text-muted">{inr.format(emp.ta)}</span>,
    },
    {
      key: "deductions",
      header: "Deductions",
      sortable: true,
      align: "right",
      render: (emp) => (
        <span className="whitespace-nowrap font-medium text-danger">
          -{inr.format(emp.deductions)}
        </span>
      ),
    },
    {
      key: "net",
      header: "Net Salary",
      sortable: true,
      align: "right",
      render: (emp) => (
        <span className="whitespace-nowrap font-semibold text-success">{inr.format(emp.net)}</span>
      ),
    },
    {
      key: "bank",
      header: "Bank",
      render: (emp) => <span className="whitespace-nowrap font-mono text-xs text-subtle">{emp.bank}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (emp) => {
        const sc = statusConfig[emp.status] ?? statusConfig.pending;
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
      render: (emp) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setPayslipFor(emp)}
            title="View salary slip"
            aria-label={`View salary slip — ${emp.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => downloadSlip(emp)}
            title="Download salary slip"
            aria-label={`Download salary slip — ${emp.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Download className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Payroll"
        description="Manage staff salaries and monthly disbursements"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            {/* Disabled until a disbursement backend exists. A live-looking
                "Run Payroll" that silently does nothing is worse than none. */}
            <Button disabled title="Salary disbursement is not connected yet">
              <Send className="size-4" />
              Run Payroll
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Payroll (Jul)" value={inr.format(totalNet)} icon={Wallet} tone="indigo" />
        <StatCard label="Disbursed" value={inr.format(totalPaid)} icon={CheckCircle} tone="emerald" />
        <StatCard label="Pending" value={inr.format(totalPending)} icon={Clock} tone="amber" />
        <StatCard label="Total Staff" value={items.length} icon={Users} tone="violet" />
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">Monthly Payroll Disbursement</p>
            <p className="mt-0.5 text-xs text-muted">Total salary paid per month</p>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyPayroll} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: t.axis }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: t.axis }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
              />
              <Tooltip
                contentStyle={t.tooltip}
                cursor={{ fill: t.cursor, radius: 6 }}
                formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Payroll"]}
              />
              <Bar dataKey="amount" fill={t.series.primary} radius={[6, 6, 0, 0]} name="Payroll" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={cn(
                "focus-ring rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-44">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={roles.map((r) => ({ label: r === "All" ? "All Roles" : r, value: r }))}
            aria-label="Filter by role"
          />
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search staff…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search staff"
          />
        </div>
        <p className="text-xs text-muted">{filtered.length} employees</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(emp) => emp.id}
        loading={loading}
        emptyTitle="No records found"
        emptyDescription="Try adjusting your filters."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">
          Showing <span className="font-medium text-text">{filtered.length}</span> of{" "}
          <span className="font-medium text-text">{items.length}</span> employees
        </p>
        <p className="text-sm font-semibold text-text">
          Net Payable:{" "}
          <span className="text-success">
            {inr.format(filtered.reduce((s, e) => s + e.net, 0))}
          </span>
        </p>
      </div>

      <PayslipModal employee={payslipFor} onOpenChange={(open) => !open && setPayslipFor(null)} />
    </div>
  );
}
