"use client";

import React, { useState } from "react";
import { Check, X, Clock, Download, ChevronLeft, ChevronRight, Users } from "lucide-react";
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

const classes = ["6-A", "6-B", "7-A", "7-B", "8-A", "9-A", "9-B", "10-A", "10-B", "11-A", "12-A", "12-B"];

type AttendanceStatus = "present" | "absent" | "late";

const NAME_POOL = [
  "Aarav Sharma", "Priya Patel", "Rohan Verma", "Sneha Gupta", "Karan Singh",
  "Ananya Joshi", "Vikram Nair", "Meera Iyer", "Arjun Reddy", "Pooja Mishra",
  "Rahul Das", "Divya Menon", "Ishaan Kapoor", "Nisha Rao", "Aditya Bose",
  "Tara Sethi", "Yash Chauhan", "Riya Malhotra", "Kabir Anand", "Sara Qureshi",
  "Manav Trivedi", "Lakshmi Pillai", "Dev Bhatia", "Anjali Saxena", "Nikhil Rane",
  "Farah Khan", "Sameer Dutta", "Kavya Hegde", "Om Prakash", "Neha Kulkarni",
  "Rudra Jain", "Isha Chandra", "Veer Solanki", "Tanvi Shetty", "Aryan Mehta",
  "Shruti Bansal", "Harsh Vyas", "Zoya Ansari", "Naveen Kumar", "Pallavi Ghosh",
];

/** Default roll-call pattern; each class starts from a different point in it. */
const STATUS_CYCLE: AttendanceStatus[] = [
  "present", "present", "absent", "present", "present", "late",
  "present", "absent", "present", "present", "late", "present",
];

type Student = { id: string; name: string; roll: number; className: string; status: AttendanceStatus };

/** Every class gets its own roster — 10 to 12 students, drawn from the pool. */
function rosterFor(className: string, classIndex: number): Student[] {
  const size = 10 + (classIndex % 3);
  const nameOffset = (classIndex * 7) % NAME_POOL.length;

  return Array.from({ length: size }, (_, i) => ({
    id: `${className}-${String(i + 1).padStart(2, "0")}`,
    name: NAME_POOL[(nameOffset + i) % NAME_POOL.length],
    roll: i + 1,
    className,
    status: STATUS_CYCLE[(classIndex + i) % STATUS_CYCLE.length],
  }));
}

const studentsByClass: Record<string, Student[]> = Object.fromEntries(
  classes.map((c, i) => [c, rosterFor(c, i)])
);

const weeklyData = [
  { day: "Mon", present: 1180, absent: 60 },
  { day: "Tue", present: 1200, absent: 40 },
  { day: "Wed", present: 1150, absent: 90 },
  { day: "Thu", present: 1210, absent: 30 },
  { day: "Fri", present: 1100, absent: 140 },
  { day: "Sat", present: 980,  absent: 60 },
];

const statusConfig: Record<AttendanceStatus, { tone: string; bar: string; label: string }> = {
  present: { tone: "bg-success-soft text-success-text", bar: "bg-success", label: "Present" },
  absent:  { tone: "bg-danger-soft text-danger-text",   bar: "bg-danger",  label: "Absent"  },
  late:    { tone: "bg-warning-soft text-warning-text", bar: "bg-warning", label: "Late"    },
};

const statusIcon: Record<AttendanceStatus, typeof Check> = {
  present: Check,
  absent: X,
  late: Clock,
};

export default function AttendancePage() {
  const chart = useChartTheme();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState("10-A");
  // Keyed by the globally unique student id, so each class keeps its own marks
  // and a class switch can never show another class's roll call.
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  // Which class was last saved — derived comparison beats resetting in an effect.
  const [savedClass, setSavedClass] = useState<string | null>(null);

  const roster = studentsByClass[selectedClass] ?? [];
  const statusOf = (s: Student): AttendanceStatus => attendance[s.id] ?? s.status;
  const statuses = roster.map(statusOf);
  const saved = savedClass === selectedClass;

  const present = statuses.filter(v => v === "present").length;
  const absent  = statuses.filter(v => v === "absent").length;
  const late    = statuses.filter(v => v === "late").length;
  const pct     = roster.length > 0 ? Math.round((present / roster.length) * 100) : 0;

  const mark = (id: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
    setSavedClass(null);
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      ...Object.fromEntries(roster.map(s => [s.id, status])),
    }));
    setSavedClass(null);
  };

  const pctVariant = pct >= 90 ? "success" : pct >= 75 ? "warning" : "danger";

  const handleExport = () => {
    if (roster.length === 0) {
      toast({
        title: "Nothing to export",
        description: `No students on the roll for ${selectedClass}.`,
        variant: "warning",
      });
      return;
    }
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    exportToCsv<Student>(
      `attendance-${selectedClass}`,
      [
        { header: "Date", value: () => today },
        { header: "Class", value: (s) => s.className },
        { header: "Roll No", value: (s) => s.roll },
        { header: "Student ID", value: (s) => s.id },
        { header: "Name", value: (s) => s.name },
        { header: "Status", value: (s) => statusConfig[statusOf(s)].label },
      ],
      roster
    );
    toast({
      title: "Export ready",
      description: `${roster.length} attendance record${roster.length === 1 ? "" : "s"} for ${selectedClass} exported to CSV.`,
    });
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
            const sharePct =
              roster.length > 0 ? Math.round((s.value / roster.length) * 100) : 0;
            return (
              <Card key={s.key}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-md",
                        statusConfig[s.key].tone
                      )}
                    >
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
                      <div
                        className={cn("h-full rounded-full", statusConfig[s.key].bar)}
                        style={{ width: `${sharePct}%` }}
                      />
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
          <div className="w-44">
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={classes.map((c) => ({ label: `Class ${c}`, value: c }))}
              aria-label="Select class"
            />
          </div>
          <p className="text-xs text-muted">{roster.length} students</p>

          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => markAll("present")}>
              <Check className="size-3.5" />
              Mark All Present
            </Button>
            <Button size="sm" variant="secondary" onClick={() => markAll("absent")}>
              <X className="size-3.5" />
              Mark All Absent
            </Button>
          </div>

          <Badge variant={pctVariant} className="px-3.5 py-1.5 text-sm font-semibold">
            {pct}% Present
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {roster.map((s) => {
            const st = statusOf(s);
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 border-b border-border px-5 py-3.5"
              >
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
                          isActive
                            ? statusConfig[status].tone
                            : "bg-surface-sunken text-subtle hover:bg-surface-hover hover:text-text"
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

        <div className="flex items-center justify-end gap-3 px-5 py-4">
          {saved && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success-text">
              <Check className="size-4" />
              Attendance saved for Class {selectedClass}!
            </p>
          )}
          <Button onClick={() => setSavedClass(selectedClass)}>Save Attendance</Button>
        </div>
      </Card>
    </div>
  );
}
