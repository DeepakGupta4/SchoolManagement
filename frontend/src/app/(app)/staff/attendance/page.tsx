"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays, CalendarOff, Check, Download, Save, Search, UserCheck, UserX, Users,
} from "lucide-react";
import {
  Avatar, Badge, Button, Input, PageHeader, Select, StatCard, Table,
  useToast, type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useAsyncList } from "@/hooks/useAsyncList";
import { TODAY_ISO } from "@/lib/dates";
import { fetchAllTeachers } from "@/lib/api/teachers";
import { fetchAllStaff } from "@/lib/api/staff";
import { teacherName } from "@/types/teacher";
import {
  getStaffAttendance,
  saveStaffAttendance,
  type StaffAttendanceStatus,
  type StaffAttendanceMark,
} from "@/lib/api/staffAttendance";

interface RosterRow {
  type: "teacher" | "staff";
  personId: string;
  employeeId: string;
  name: string;
  role: string;
  dept: string;
}

const STATUS_OPTIONS: { label: string; value: StaffAttendanceStatus }[] = [
  { label: "Present", value: "present" },
  { label: "Absent", value: "absent" },
  { label: "Late", value: "late" },
  { label: "Half-day", value: "half-day" },
  { label: "Leave", value: "leave" },
];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
const STATUS_VARIANT: Record<StaffAttendanceStatus, BadgeVariant> = {
  present: "success",
  absent: "danger",
  late: "warning",
  "half-day": "info",
  leave: "default",
};

export default function StaffAttendancePage() {
  const { toast } = useToast();

  const [date, setDate] = useState(TODAY_ISO);
  const [typeFilter, setTypeFilter] = useState<"All" | "teacher" | "staff">("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Server-saved statuses for the date + the operator's unsaved edits on top.
  const [savedMap, setSavedMap] = useState<Record<string, StaffAttendanceStatus>>({});
  const [edits, setEdits] = useState<Record<string, StaffAttendanceStatus>>({});
  const [loadingMarks, setLoadingMarks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // The whole workforce (teachers + staff), each as a uniform roster row.
  const fetchRoster = useCallback(async (): Promise<RosterRow[]> => {
    const [teachers, staff] = await Promise.all([fetchAllTeachers(), fetchAllStaff()]);
    return [
      ...teachers.map((t) => ({
        type: "teacher" as const,
        personId: t.id,
        employeeId: t.employeeId,
        name: teacherName(t),
        role: "Teacher",
        dept: t.department,
      })),
      ...staff.map((s) => ({
        type: "staff" as const,
        personId: s.id,
        employeeId: s.employeeId,
        name: s.name,
        role: s.role,
        dept: s.dept,
      })),
    ];
  }, []);
  const { items: roster, loading: rosterLoading } = useAsyncList<RosterRow>(fetchRoster);

  // Load the saved roll-call whenever the date changes; drop unsaved edits.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingMarks(true);
    getStaffAttendance(date)
      .then((rows) => {
        if (cancelled) return;
        const map: Record<string, StaffAttendanceStatus> = {};
        for (const r of rows) map[r.personId] = r.status;
        setSavedMap(map);
        setEdits({});
      })
      .catch(() => {
        if (cancelled) return;
        setSavedMap({});
        setEdits({});
      })
      .finally(() => {
        if (!cancelled) setLoadingMarks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, reloadKey]);

  // Unmarked people default to "present" (roll-call: flip the absentees).
  const statusOf = (id: string): StaffAttendanceStatus => edits[id] ?? savedMap[id] ?? "present";
  const setStatus = (id: string, status: StaffAttendanceStatus) =>
    setEdits((prev) => ({ ...prev, [id]: status }));

  const deptList = useMemo(() => {
    const set = new Set<string>();
    for (const r of roster) if (r.dept) set.add(r.dept);
    return [...set].sort();
  }, [roster]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roster.filter(
      (r) =>
        (typeFilter === "All" || r.type === typeFilter) &&
        (deptFilter === "All" || r.dept === deptFilter) &&
        (!q || r.name.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q))
    );
  }, [roster, typeFilter, deptFilter, search]);

  // Tiles count the whole workforce for the day, not the filtered view.
  const counts = useMemo(() => {
    let present = 0,
      absent = 0,
      leave = 0;
    for (const r of roster) {
      const s = statusOf(r.personId);
      if (s === "present" || s === "late" || s === "half-day") present++;
      else if (s === "absent") absent++;
      else if (s === "leave") leave++;
    }
    return { present, absent, leave, total: roster.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, edits, savedMap]);

  const dirty = Object.keys(edits).length > 0;

  const markAllPresent = () =>
    setEdits(Object.fromEntries(roster.map((r) => [r.personId, "present" as StaffAttendanceStatus])));

  const handleSave = async () => {
    if (roster.length === 0) return;
    const records: StaffAttendanceMark[] = roster.map((r) => ({ ...r, status: statusOf(r.personId) }));
    try {
      setSaving(true);
      await saveStaffAttendance({ date, records });
      toast({ title: "Attendance saved", description: `${records.length} marked for ${date}.`, variant: "success" });
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (visible.length === 0) {
      toast({ title: "Nothing to export", variant: "warning" });
      return;
    }
    exportToCsv<RosterRow>(
      `staff-attendance-${date}`,
      [
        { header: "Employee ID", value: (r) => r.employeeId },
        { header: "Name", value: (r) => r.name },
        { header: "Type", value: (r) => (r.type === "teacher" ? "Teacher" : "Staff") },
        { header: "Department", value: (r) => r.dept },
        { header: "Role", value: (r) => r.role },
        { header: "Status", value: (r) => statusOf(r.personId) },
      ],
      visible
    );
    toast({ title: "Export ready", description: `${visible.length} rows exported to CSV.` });
  };

  const loading = rosterLoading || loadingMarks;

  const columns: Column<RosterRow>[] = [
    {
      key: "name",
      header: "Employee",
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{r.name}</p>
            <p className="truncate text-xs text-subtle">{r.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (r) => (
        <Badge variant={r.type === "teacher" ? "info" : "default"}>
          {r.type === "teacher" ? "Teacher" : "Staff"}
        </Badge>
      ),
    },
    { key: "dept", header: "Department", sortable: true, render: (r) => <span className="text-muted">{r.dept || "—"}</span> },
    { key: "role", header: "Role", render: (r) => <span className="text-muted">{r.role || "—"}</span> },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Badge variant={STATUS_VARIANT[statusOf(r.personId)]}>{statusOf(r.personId)}</Badge>
          <div className="w-32">
            <Select
              value={statusOf(r.personId)}
              onChange={(e) => setStatus(r.personId, e.target.value as StaffAttendanceStatus)}
              options={STATUS_OPTIONS}
              aria-label={`Attendance status for ${r.name}`}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Staff Attendance"
        description="Mark daily attendance for teachers and non-teaching staff."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={handleSave} disabled={saving || loading || roster.length === 0}>
              <Save className="size-4" />
              {saving ? "Saving…" : "Save attendance"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={counts.total} icon={Users} tone="indigo" />
        <StatCard label="Present" value={counts.present} icon={UserCheck} tone="emerald" />
        <StatCard label="Absent" value={counts.absent} icon={UserX} tone="rose" />
        <StatCard label="On leave" value={counts.leave} icon={CalendarOff} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Input
            type="date"
            value={date}
            max={TODAY_ISO}
            onChange={(e) => setDate(e.target.value)}
            icon={<CalendarDays className="size-4" />}
            aria-label="Attendance date"
          />
        </div>
        <div className="min-w-48 flex-1">
          <Input
            type="search"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search employees"
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
            options={[
              { label: "All Departments", value: "All" },
              ...deptList.map((d) => ({ label: d, value: d })),
            ]}
            aria-label="Filter by department"
          />
        </div>
        <Button variant="outline" onClick={markAllPresent} disabled={roster.length === 0}>
          <Check className="size-4" />
          Mark all present
        </Button>
      </div>

      {dirty && (
        <p className="text-xs text-warning-text">You have unsaved changes — click “Save attendance”.</p>
      )}

      <Table
        columns={columns}
        rows={visible}
        rowKey={(r) => `${r.type}:${r.personId}`}
        loading={loading}
        pageSize={25}
        emptyTitle="No people found"
        emptyDescription="Add teachers or staff, or adjust the filters."
      />

      <p className="text-xs text-subtle">
        {visible.length} shown · unmarked people count as <strong className="text-text">Present</strong> until you change them.
      </p>
    </div>
  );
}
