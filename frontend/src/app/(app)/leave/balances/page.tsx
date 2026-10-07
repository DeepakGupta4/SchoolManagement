"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, Users, CalendarCheck, CalendarOff, AlertTriangle } from "lucide-react";
import {
  Avatar, Badge, Button, Card, CardContent, Input, PageHeader, Select, StatCard, Table,
  TableSkeleton, useToast, type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { TODAY_ISO } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { fetchAllTeachers } from "@/lib/api/teachers";
import { fetchAllStaff } from "@/lib/api/staff";
import { teacherName } from "@/types/teacher";
import { leaveRequestsApi, LEAVE_QUOTA } from "@/lib/api/leaveRequests";

const TYPES = Object.keys(LEAVE_QUOTA);
const YEAR = TODAY_ISO.slice(0, 4);

interface BalanceRow {
  name: string;
  type: "teacher" | "staff";
  dept: string;
  role: string;
  used: Record<string, number>;
  totalUsed: number;
  overQuota: boolean;
}

function cellTone(used: number, quota: number): string {
  if (used > quota) return "text-danger font-semibold";
  if (quota > 0 && used >= quota * 0.8) return "text-warning-text font-medium";
  if (used === 0) return "text-subtle";
  return "text-text";
}

export default function LeaveBalancesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BalanceRow[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "teacher" | "staff">("All");
  const [deptFilter, setDeptFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      fetchAllTeachers(),
      fetchAllStaff(),
      leaveRequestsApi.list({ status: "Approved", limit: 500 }),
    ])
      .then(([teachers, staff, approved]) => {
        if (cancelled) return;
        // Days taken per person per type, this calendar year (by the `from` date).
        const used = new Map<string, Map<string, number>>();
        let inYear = 0;
        for (const l of approved) {
          if ((l.from || "").slice(0, 4) !== YEAR) continue;
          inYear++;
          if (!used.has(l.name)) used.set(l.name, new Map());
          const m = used.get(l.name)!;
          m.set(l.type, (m.get(l.type) ?? 0) + (l.days || 0));
        }

        const roster: Omit<BalanceRow, "used" | "totalUsed" | "overQuota">[] = [
          ...teachers.map((t) => ({ name: teacherName(t), type: "teacher" as const, dept: t.department, role: "Teacher" })),
          ...staff.map((s) => ({ name: s.name, type: "staff" as const, dept: s.dept, role: s.role })),
        ];

        const built: BalanceRow[] = roster.map((r) => {
          const m = used.get(r.name);
          const usedByType: Record<string, number> = {};
          let totalUsed = 0;
          let overQuota = false;
          for (const t of TYPES) {
            const u = m?.get(t) ?? 0;
            usedByType[t] = u;
            totalUsed += u;
            if (u > LEAVE_QUOTA[t]) overQuota = true;
          }
          return { ...r, used: usedByType, totalUsed, overQuota };
        });

        setRows(built);
        setApprovedCount(inYear);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deptList = useMemo(() => [...new Set(rows.map((r) => r.dept).filter(Boolean))].sort(), [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (typeFilter === "All" || r.type === typeFilter) &&
        (deptFilter === "All" || r.dept === deptFilter) &&
        (!q || r.name.toLowerCase().includes(q))
    );
  }, [rows, typeFilter, deptFilter, search]);

  const daysTaken = useMemo(() => rows.reduce((s, r) => s + r.totalUsed, 0), [rows]);
  const overQuota = useMemo(() => rows.filter((r) => r.overQuota).length, [rows]);

  const handleExport = () => {
    if (visible.length === 0) {
      toast({ title: "Nothing to export", variant: "warning" });
      return;
    }
    exportToCsv<BalanceRow>(
      `leave-balances-${YEAR}`,
      [
        { header: "Name", value: (r) => r.name },
        { header: "Type", value: (r) => (r.type === "teacher" ? "Teacher" : "Staff") },
        { header: "Department", value: (r) => r.dept },
        ...TYPES.map((t) => ({
          header: `${t} (used/${LEAVE_QUOTA[t]})`,
          value: (r: BalanceRow) => `${r.used[t] ?? 0}/${LEAVE_QUOTA[t]}`,
        })),
        { header: "Total taken", value: (r) => r.totalUsed },
      ],
      visible
    );
    toast({ title: "Export ready", description: `${visible.length} rows exported to CSV.` });
  };

  const columns: Column<BalanceRow>[] = [
    {
      key: "name",
      header: "Employee",
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium text-text">
              {r.name}
              <Badge variant={r.type === "teacher" ? "info" : "default"}>
                {r.type === "teacher" ? "Teacher" : "Staff"}
              </Badge>
            </p>
            <p className="truncate text-xs text-subtle">{r.dept || "—"}</p>
          </div>
        </div>
      ),
    },
    ...TYPES.map(
      (t): Column<BalanceRow> => ({
        key: t,
        header: t.replace(" Leave", ""),
        align: "right",
        sortable: true,
        sortValue: (r) => r.used[t] ?? 0,
        render: (r) => (
          <span className={cn("tabular-nums", cellTone(r.used[t] ?? 0, LEAVE_QUOTA[t]))}>
            {r.used[t] ?? 0}/{LEAVE_QUOTA[t]}
          </span>
        ),
      })
    ),
    {
      key: "totalUsed",
      header: "Taken",
      align: "right",
      sortable: true,
      render: (r) => <span className="font-semibold tabular-nums text-text">{r.totalUsed}d</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Leave Balances"
        description={`Annual leave usage vs entitlement for ${YEAR}. Approving a leave reduces the balance automatically.`}
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="People" value={error ? "—" : rows.length} icon={Users} tone="indigo" />
        <StatCard label={`Leaves approved (${YEAR})`} value={error ? "—" : approvedCount} icon={CalendarCheck} tone="emerald" />
        <StatCard label="Days taken" value={error ? "—" : daysTaken} icon={CalendarOff} tone="cyan" />
        <StatCard label="Over quota" value={error ? "—" : overQuota} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-48 flex-1">
          <Input
            type="search"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search people"
          />
        </div>
        <div className="w-40">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "All" | "teacher" | "staff")}
            options={[
              { label: "All people", value: "All" },
              { label: "Teachers", value: "teacher" },
              { label: "Staff", value: "staff" },
            ]}
            aria-label="Filter by type"
          />
        </div>
        <div className="w-44">
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={[{ label: "All Departments", value: "All" }, ...deptList.map((d) => ({ label: d, value: d }))]}
            aria-label="Filter by department"
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={TYPES.length + 2} />
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-danger">Could not load leave balances.</p>
            <p className="text-xs text-muted">Check that the API server is running, then reload this page.</p>
          </CardContent>
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={visible}
          rowKey={(r) => `${r.type}:${r.name}`}
          pageSize={25}
          rowClassName={(r) => (r.overQuota ? "bg-danger-soft/30" : undefined)}
          emptyTitle="No people found"
          emptyDescription="Add teachers or staff, or adjust the filters."
        />
      )}

      <p className="text-xs text-subtle">
        Balances are days taken (approved leaves dated in {YEAR}) against the default annual quota per type.
        Rows over quota are highlighted. Per-staff quota overrides can be added later.
      </p>
    </div>
  );
}
