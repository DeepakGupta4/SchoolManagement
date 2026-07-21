"use client";

import React, { useMemo, useState } from "react";
import {
  Download,
  Fingerprint,
  KeyRound,
  Laptop,
  LogOut,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCog,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";

const ROLES = [
  { id: "principal", name: "Principal", users: 1, tone: "danger" as const },
  { id: "admin", name: "Admin Staff", users: 6, tone: "warning" as const },
  { id: "teacher", name: "Class Teacher", users: 48, tone: "info" as const },
  { id: "accountant", name: "Accountant", users: 3, tone: "success" as const },
  { id: "librarian", name: "Librarian", users: 2, tone: "default" as const },
  { id: "parent", name: "Parent", users: 1240, tone: "default" as const },
];

const MODULES = [
  { id: "students", name: "Students" },
  { id: "teachers", name: "Teachers" },
  { id: "attendance", name: "Attendance" },
  { id: "fees", name: "Fees & Payments" },
  { id: "exams", name: "Exams & Results" },
  { id: "payroll", name: "Payroll" },
  { id: "transport", name: "Transport" },
  { id: "settings", name: "Settings" },
];

const ACTIONS = ["view", "create", "edit", "delete"] as const;
type ActionId = (typeof ACTIONS)[number];

/** Seeded so the matrix reads like a real Indian-school RBAC setup. */
const DEFAULT_GRANTS: Record<string, Record<string, ActionId[]>> = {
  principal: {
    students: ["view", "create", "edit", "delete"],
    teachers: ["view", "create", "edit", "delete"],
    attendance: ["view", "create", "edit", "delete"],
    fees: ["view", "create", "edit", "delete"],
    exams: ["view", "create", "edit", "delete"],
    payroll: ["view", "create", "edit", "delete"],
    transport: ["view", "create", "edit", "delete"],
    settings: ["view", "create", "edit", "delete"],
  },
  admin: {
    students: ["view", "create", "edit"],
    teachers: ["view", "create", "edit"],
    attendance: ["view", "edit"],
    fees: ["view", "create"],
    exams: ["view"],
    payroll: [],
    transport: ["view", "create", "edit"],
    settings: ["view"],
  },
  teacher: {
    students: ["view"],
    teachers: ["view"],
    attendance: ["view", "create", "edit"],
    fees: [],
    exams: ["view", "create", "edit"],
    payroll: [],
    transport: ["view"],
    settings: [],
  },
  accountant: {
    students: ["view"],
    teachers: ["view"],
    attendance: [],
    fees: ["view", "create", "edit", "delete"],
    exams: [],
    payroll: ["view", "create", "edit"],
    transport: ["view"],
    settings: [],
  },
  librarian: {
    students: ["view"],
    teachers: ["view"],
    attendance: [],
    fees: [],
    exams: [],
    payroll: [],
    transport: [],
    settings: [],
  },
  parent: {
    students: ["view"],
    teachers: [],
    attendance: ["view"],
    fees: ["view"],
    exams: ["view"],
    payroll: [],
    transport: ["view"],
    settings: [],
  },
};

const AUDIT_LOG = [
  { id: "AU-2041", user: "Dr. Priya Sharma",  role: "Principal",     action: "Updated fee structure for Class 10", module: "Fees",       ip: "103.21.58.14",  at: "21 Jul 2026, 10:42 AM", severity: "info" },
  { id: "AU-2040", user: "Mr. Anil Kumar",    role: "Accountant",    action: "Deleted duplicate receipt #RC-8841",  module: "Fees",       ip: "103.21.58.22",  at: "21 Jul 2026, 09:58 AM", severity: "high" },
  { id: "AU-2039", user: "Ms. Sunita Verma",  role: "Admin Staff",   action: "Added student Aarav Mehta (X-B)",     module: "Students",   ip: "103.21.58.09",  at: "21 Jul 2026, 09:31 AM", severity: "info" },
  { id: "AU-2038", user: "Mr. Suresh Nair",   role: "Admin Staff",   action: "Changed role of Kavita Joshi",        module: "Security",   ip: "103.21.58.31",  at: "20 Jul 2026, 05:12 PM", severity: "high" },
  { id: "AU-2037", user: "Ms. Anita Patel",   role: "Class Teacher", action: "Marked attendance for VII-A",         module: "Attendance", ip: "49.36.180.77",  at: "20 Jul 2026, 08:22 AM", severity: "low"  },
  { id: "AU-2036", user: "Unknown",           role: "—",             action: "5 failed login attempts",             module: "Auth",       ip: "185.220.101.4", at: "19 Jul 2026, 11:47 PM", severity: "critical" },
  { id: "AU-2035", user: "Mr. Rahul Verma",   role: "Class Teacher", action: "Published Physics term-1 results",    module: "Exams",      ip: "49.36.180.12",  at: "19 Jul 2026, 04:05 PM", severity: "info" },
  { id: "AU-2034", user: "Mr. Anil Kumar",    role: "Accountant",    action: "Exported payroll register (Jun)",     module: "Payroll",    ip: "103.21.58.22",  at: "19 Jul 2026, 02:40 PM", severity: "high" },
  { id: "AU-2033", user: "Ms. Kavita Singh",  role: "Class Teacher", action: "Downloaded XI-B student contacts",    module: "Students",   ip: "49.36.180.55",  at: "18 Jul 2026, 01:15 PM", severity: "low"  },
  { id: "AU-2032", user: "Dr. Priya Sharma",  role: "Principal",     action: "Enabled WhatsApp fee reminders",      module: "Settings",   ip: "103.21.58.14",  at: "18 Jul 2026, 10:03 AM", severity: "info" },
  { id: "AU-2031", user: "Ms. Pooja Mehta",   role: "Admin Staff",   action: "Approved 3 leave requests",           module: "Leave",      ip: "103.21.58.18",  at: "17 Jul 2026, 03:48 PM", severity: "low"  },
  { id: "AU-2030", user: "Mr. Deepak Singh",  role: "Admin Staff",   action: "Reset password for gate operator",    module: "Security",   ip: "103.21.58.44",  at: "17 Jul 2026, 09:12 AM", severity: "high" },
];

const SESSIONS = [
  { id: "SS-01", user: "Dr. Priya Sharma",  role: "Principal",     device: "MacBook Pro · Chrome 141",   type: "desktop", location: "Gurugram, HR", ip: "103.21.58.14", last: "Active now",       current: true  },
  { id: "SS-02", user: "Ms. Sunita Verma",  role: "Admin Staff",   device: "Windows 11 · Edge 140",      type: "desktop", location: "Gurugram, HR", ip: "103.21.58.09", last: "4 minutes ago",    current: false },
  { id: "SS-03", user: "Mr. Anil Kumar",    role: "Accountant",    device: "Windows 11 · Chrome 141",    type: "desktop", location: "Gurugram, HR", ip: "103.21.58.22", last: "22 minutes ago",   current: false },
  { id: "SS-04", user: "Ms. Anita Patel",   role: "Class Teacher", device: "Redmi Note 13 · App 4.2.1",  type: "mobile",  location: "Delhi, DL",    ip: "49.36.180.77", last: "1 hour ago",       current: false },
  { id: "SS-05", user: "Mr. Rahul Verma",   role: "Class Teacher", device: "iPad Air · Safari 18",       type: "mobile",  location: "Noida, UP",    ip: "49.36.180.12", last: "3 hours ago",      current: false },
  { id: "SS-06", user: "Mr. Suresh Nair",   role: "Admin Staff",   device: "Ubuntu 24.04 · Firefox 133", type: "desktop", location: "Gurugram, HR", ip: "103.21.58.31", last: "Yesterday, 6 PM",  current: false },
];

type AuditRow = (typeof AUDIT_LOG)[number];
type SessionRow = (typeof SESSIONS)[number];

const SEVERITY_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  low: "default",
  info: "info",
  high: "warning",
  critical: "danger",
};

const PAGE_SIZE = 6;

export default function SecurityPage() {
  const { toast } = useToast();

  const [grants, setGrants] = useState(DEFAULT_GRANTS);
  const [role, setRole] = useState("admin");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const [revoking, setRevoking] = useState<SessionRow | null>(null);
  const [revoked, setRevoked] = useState<string[]>([]);

  const roleGrants = useMemo(() => grants[role] ?? {}, [grants, role]);

  const togglePermission = (moduleId: string, action: ActionId) => {
    setGrants((prev) => {
      const current = prev[role]?.[moduleId] ?? [];
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [role]: { ...prev[role], [moduleId]: next } };
    });
  };

  const toggleModuleRow = (moduleId: string) => {
    setGrants((prev) => {
      const current = prev[role]?.[moduleId] ?? [];
      const next: ActionId[] = current.length === ACTIONS.length ? [] : [...ACTIONS];
      return { ...prev, [role]: { ...prev[role], [moduleId]: next } };
    });
  };

  const grantedCount = useMemo(
    () => Object.values(roleGrants).reduce((sum, list) => sum + list.length, 0),
    [roleGrants]
  );

  const filteredLog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AUDIT_LOG.filter((entry) => {
      const matchSearch =
        !q ||
        entry.user.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.module.toLowerCase().includes(q) ||
        entry.ip.includes(q);
      const matchSeverity = !severity || entry.severity === severity;
      return matchSearch && matchSeverity;
    });
  }, [search, severity]);

  const pagedLog = filteredLog.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const liveSessions = SESSIONS.filter((s) => !revoked.includes(s.id));

  const auditColumns: Column<AuditRow>[] = [
    {
      key: "user",
      header: "User",
      sortable: true,
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.user} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{e.user}</p>
            <p className="truncate text-xs text-subtle">{e.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Activity",
      render: (e) => <span className="text-muted">{e.action}</span>,
    },
    { key: "module", header: "Module", sortable: true, render: (e) => <Badge variant="outline">{e.module}</Badge> },
    { key: "ip", header: "IP address", render: (e) => <span className="whitespace-nowrap text-subtle">{e.ip}</span> },
    { key: "at", header: "When", render: (e) => <span className="whitespace-nowrap text-muted">{e.at}</span> },
    {
      key: "severity",
      header: "Severity",
      sortable: true,
      align: "right",
      render: (e) => (
        <Badge variant={SEVERITY_VARIANT[e.severity] ?? "default"} className="capitalize">
          {e.severity}
        </Badge>
      ),
    },
  ];

  const sessionColumns: Column<SessionRow>[] = [
    {
      key: "user",
      header: "User",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.user} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.user}</p>
            <p className="truncate text-xs text-subtle">{s.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: "device",
      header: "Device",
      render: (s) => (
        <span className="inline-flex items-center gap-2 text-muted">
          {s.type === "mobile" ? (
            <Smartphone className="size-4 text-subtle" />
          ) : (
            <Laptop className="size-4 text-subtle" />
          )}
          {s.device}
        </span>
      ),
    },
    { key: "location", header: "Location", render: (s) => <span className="whitespace-nowrap text-muted">{s.location}</span> },
    { key: "ip", header: "IP", render: (s) => <span className="whitespace-nowrap text-subtle">{s.ip}</span> },
    {
      key: "last",
      header: "Last active",
      render: (s) =>
        s.current ? (
          <Badge variant="success">This device</Badge>
        ) : (
          <span className="whitespace-nowrap text-muted">{s.last}</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={s.current}
          onClick={() => setRevoking(s)}
          aria-label={`Revoke session for ${s.user}`}
        >
          <LogOut className="size-3.5" />
          Revoke
        </Button>
      ),
    },
  ];

  const handleRevoke = () => {
    if (!revoking) return;
    setRevoked((prev) => [...prev, revoking.id]);
    toast({
      title: "Session revoked",
      description: `${revoking.user} was signed out of ${revoking.device}.`,
      variant: "success",
    });
    setRevoking(null);
  };

  const handleSavePermissions = () => {
    const roleName = ROLES.find((r) => r.id === role)?.name ?? "Role";
    toast({
      title: "Permissions saved",
      description: `${roleName} now has ${grantedCount} permissions across ${MODULES.length} modules.`,
      variant: "success",
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Security"
        description="Roles, permissions, audit trail and active device sessions."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Audit log exported",
                  description: `${filteredLog.length} entries queued as CSV.`,
                  variant: "info",
                })
              }
            >
              <Download className="size-4" />
              Export audit log
            </Button>
            <Button onClick={handleSavePermissions}>
              <Save className="size-4" />
              Save permissions
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Roles configured" value={ROLES.length} icon={UserCog} tone="indigo" />
        <StatCard label="Granted permissions" value={grantedCount} icon={KeyRound} tone="emerald" sub="Selected role" />
        <StatCard label="Active sessions" value={liveSessions.length} icon={Fingerprint} tone="cyan" />
        <StatCard
          label="Critical events (7d)"
          value={AUDIT_LOG.filter((e) => e.severity === "critical").length}
          icon={ShieldAlert}
          tone="rose"
        />
      </div>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Roles &amp; permissions</h2>
            <p className="mt-0.5 text-xs text-muted">
              Tick what each role may do in every module. Changes apply on save.
            </p>
          </div>
          <div className="w-56">
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={ROLES.map((r) => ({ label: `${r.name} (${r.users})`, value: r.id }))}
              aria-label="Select role"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                aria-pressed={role === r.id}
                className={`focus-ring rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  role === r.id
                    ? "border-primary bg-primary-soft text-primary-text"
                    : "border-border text-muted hover:bg-surface-hover hover:text-text"
                }`}
              >
                {r.name}
                <span className="ml-1.5 text-subtle">{r.users}</span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    Module
                  </th>
                  {ACTIONS.map((a) => (
                    <th
                      key={a}
                      scope="col"
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted"
                    >
                      {a}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    All
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod) => {
                  const list = roleGrants[mod.id] ?? [];
                  return (
                    <tr key={mod.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-text">{mod.name}</td>
                      {ACTIONS.map((a) => (
                        <td key={a} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={list.includes(a)}
                            onChange={() => togglePermission(mod.id, a)}
                            aria-label={`${a} ${mod.name}`}
                            className="focus-ring size-4 cursor-pointer rounded-sm accent-primary"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleModuleRow(mod.id)}
                          className="focus-ring rounded-sm text-xs font-medium text-primary hover:underline"
                        >
                          {list.length === ACTIONS.length ? "Clear" : "Select all"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Audit log</h2>
            <p className="mt-0.5 text-xs text-muted">Every write action recorded with actor and IP.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-56">
              <Input
                type="search"
                placeholder="Search user, action or IP…"
                value={search}
                onChange={(e) => applyFilter(setSearch)(e.target.value)}
                aria-label="Search audit log"
              />
            </div>
            <div className="w-40">
              <Select
                value={severity}
                onChange={(e) => applyFilter(setSeverity)(e.target.value)}
                placeholder="All severities"
                options={[
                  { label: "Critical", value: "critical" },
                  { label: "High", value: "high" },
                  { label: "Info", value: "info" },
                  { label: "Low", value: "low" },
                ]}
                aria-label="Filter by severity"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table
            columns={auditColumns}
            rows={pagedLog}
            rowKey={(e) => e.id}
            rowClassName={(e) => (e.severity === "critical" ? "bg-danger-soft" : undefined)}
            emptyTitle="No matching audit entries"
            emptyDescription="Try clearing your filters to see more results."
          />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={filteredLog.length}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Active sessions &amp; login history</h2>
            <p className="mt-0.5 text-xs text-muted">
              Revoke a device to force a fresh sign-in on the next request.
            </p>
          </div>
          <Badge variant="success">
            <ShieldCheck className="mr-1 size-3" />
            2FA enforced for staff
          </Badge>
        </CardHeader>
        <CardContent>
          <Table
            columns={sessionColumns}
            rows={liveSessions}
            rowKey={(s) => s.id}
            rowClassName={(s) => (s.current ? "bg-primary-soft" : undefined)}
            emptyTitle="No active sessions"
            emptyDescription="Every device has been signed out."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Revoke this session?"
        description={
          revoking
            ? `${revoking.user} will be signed out of ${revoking.device} (${revoking.ip}) immediately.`
            : ""
        }
        confirmLabel="Revoke"
        destructive
        onConfirm={handleRevoke}
      />
    </div>
  );
}
