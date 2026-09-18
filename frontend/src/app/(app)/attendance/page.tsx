"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, X, Clock, Download, ChevronLeft, ChevronRight, Users, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  Select,
  useToast,
} from "@/components/ui";
import { useChartTheme } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useClassOptions } from "@/hooks/useClassOptions";
import { listStudents } from "@/lib/api/students";
import {
  getAttendance,
  saveAttendance,
  type AttendanceStatus,
  type AttendanceMark,
} from "@/lib/api/attendance";
import type { Student } from "@/types/student";

type Row = { id: string; name: string; roll: number };

const weeklyData = [
  { day: "Mon", present: 1180, absent: 60 },
  { day: "Tue", present: 1200, absent: 40 },
  { day: "Wed", present: 1150, absent: 90 },
  { day: "Thu", present: 1210, absent: 30 },
  { day: "Fri", present: 1100, absent: 140 },
  { day: "Sat", present: 980, absent: 60 },
];

const statusConfig: Record<AttendanceStatus, { tone: string; bar: string; label: string }> = {
  present: { tone: "bg-success-soft text-success-text", bar: "bg-success", label: "Present" },
  absent: { tone: "bg-danger-soft text-danger-text", bar: "bg-danger", label: "Absent" },
  late: { tone: "bg-warning-soft text-warning-text", bar: "bg-warning", label: "Late" },
};

const statusIcon: Record<AttendanceStatus, typeof Check> = { present: Check, absent: X, late: Clock };

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AttendancePage() {
  const chart = useChartTheme();
  const { toast } = useToast();
  const { classOptions, sectionOptions } = useClassOptions();

  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState(todayIso());

  const [roster, setRoster] = useState<Row[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load the class roster (real students) + any saved roll-call for the date.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      // Nothing to load until both a class and a section are chosen.
      if (!className || !section) {
        setRoster([]);
        setAttendance({});
        setDirty(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      Promise.all([listStudents({ className }), getAttendance(className, section, date)])
        .then(([students, saved]) => {
          if (cancelled) return;
          const rows: Row[] = (students as Student[])
            .filter((s) => s.section === section)
            .map((s) => ({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`.trim(),
              roll: Number(s.rollNo) || 0,
            }))
            .sort((a, b) => a.roll - b.roll);

          const savedMap = new Map(saved.map((m) => [m.studentId, m.status]));
          const marks: Record<string, AttendanceStatus> = {};
          for (const r of rows) marks[r.id] = savedMap.get(r.id) ?? "present";

          setRoster(rows);
          setAttendance(marks);
          setDirty(false);
        })
        .catch(() => {
          if (!cancelled) toast({ title: "Could not load attendance", variant: "error" });
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [className, section, date, toast]);

  const statusOf = (id: string): AttendanceStatus => attendance[id] ?? "present";
  const statuses = roster.map((r) => statusOf(r.id));
  const present = statuses.filter((v) => v === "present").length;
  const absent = statuses.filter((v) => v === "absent").length;
  const late = statuses.filter((v) => v === "late").length;
  const pct = roster.length > 0 ? Math.round((present / roster.length) * 100) : 0;

  const mark = (id: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
    setDirty(true);
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, ...Object.fromEntries(roster.map((r) => [r.id, status])) }));
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    if (roster.length === 0) return;
    setSaving(true);
    try {
      const records: AttendanceMark[] = roster.map((r) => ({
        studentId: r.id,
        studentName: r.name,
        roll: r.roll,
        status: statusOf(r.id),
      }));
      await saveAttendance({ className, section, date, records });
      setDirty(false);
      toast({ title: "Attendance saved", description: `${className} · ${section} · ${date}` });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, attendance, className, section, date, toast]);

  const pctVariant = pct >= 90 ? "success" : pct >= 75 ? "warning" : "danger";

  const handleExport = () => {
    if (roster.length === 0) {
      toast({ title: "Nothing to export", variant: "warning" });
      return;
    }
    exportToCsv<Row>(
      `attendance-${className}-${section}-${date}`,
      [
        { header: "Date", value: () => date },
        { header: "Class", value: () => `${className} ${section}` },
        { header: "Roll No", value: (r) => r.roll },
        { header: "Student ID", value: (r) => r.id },
        { header: "Name", value: (r) => r.name },
        { header: "Status", value: (r) => statusConfig[statusOf(r.id)].label },
      ],
      roster
    );
    toast({ title: "Export ready", description: `${roster.length} records exported.` });
  };

  const summary: { key: AttendanceStatus; label: string; value: number }[] = [
    { key: "present", label: "Present", value: present },
    { key: "absent", label: "Absent", value: absent },
    { key: "late", label: "Late", value: late },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Attendance"
        description={new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          {summary.map((s) => {
            const sharePct = roster.length > 0 ? Math.round((s.value / roster.length) * 100) : 0;
            return (
              <Card key={s.key}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", statusConfig[s.key].tone)}>
                      <Users className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">{s.label}</p>
                      <p className="mt-0.5 text-xl font-semibold text-text">{s.value}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-text">{sharePct}%</p>
                    <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
                      <div className={cn("h-full rounded-full", statusConfig[s.key].bar)} style={{ width: `${sharePct}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Weekly Overview</p>
              <p className="mt-0.5 text-xs text-muted">School-wide attendance this week</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" aria-label="Previous week" className="px-2">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" aria-label="Next week" className="px-2">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: chart.axis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chart.axis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor, radius: 6 }} />
                <Bar dataKey="present" fill={chart.series.primary} radius={[6, 6, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill={chart.series.danger} radius={[6, 6, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="w-36">
            <Select value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Select class" options={classOptions} aria-label="Select class" />
          </div>
          <div className="w-24">
            <Select value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section" options={sectionOptions} aria-label="Select section" />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="focus-ring h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-text"
            aria-label="Attendance date"
          />
          <p className="text-xs text-muted">{roster.length} students</p>

          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={loading || roster.length === 0} onClick={() => markAll("present")}>
              <Check className="size-3.5" />
              All Present
            </Button>
            <Button size="sm" variant="secondary" disabled={loading || roster.length === 0} onClick={() => markAll("absent")}>
              <X className="size-3.5" />
              All Absent
            </Button>
          </div>

          <Badge variant={pctVariant} className="px-3.5 py-1.5 text-sm font-semibold">
            {pct}% Present
          </Badge>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16 text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : !className || !section ? (
          <div className="py-16 text-center text-sm text-muted">
            Select a class and section to take attendance.
          </div>
        ) : roster.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">
            No students in {className} · Section {section}. Add students first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {roster.map((s) => {
              const st = statusOf(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                  <div className="gradient-indigo flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{s.name}</p>
                    <p className="mt-0.5 text-[11px] text-subtle">Roll #{s.roll}</p>
                  </div>
                  <div className="flex gap-1">
                    {(["present", "absent", "late"] as AttendanceStatus[]).map((status) => {
                      const Icon = statusIcon[status];
                      const isActive = st === status;
                      return (
                        <button
                          key={status}
                          onClick={() => mark(s.id, status)}
                          aria-label={`Mark ${s.name} ${statusConfig[status].label}`}
                          aria-pressed={isActive}
                          className={cn(
                            "focus-ring flex size-7 items-center justify-center rounded-sm transition-colors",
                            isActive ? statusConfig[status].tone : "bg-surface-sunken text-subtle hover:bg-surface-hover hover:text-text"
                          )}
                        >
                          <Icon className="size-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-5 py-4">
          {!dirty && !loading && roster.length > 0 && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success-text">
              <Check className="size-4" />
              Saved
            </p>
          )}
          <Button onClick={handleSave} disabled={saving || loading || roster.length === 0}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save Attendance
          </Button>
        </div>
      </Card>
    </div>
  );
}
