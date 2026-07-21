"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Edit,
  Eye,
  GraduationCap,
  LayoutGrid,
  Plus,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const classesData = [
  { id: 1, name: "Class 6",  sections: ["A", "B", "C"], students: 165, teachers: 8,  classTeacher: "Ms. Anita Patel",    room: "101-103", stream: "General",  color: "#6366f1" },
  { id: 2, name: "Class 7",  sections: ["A", "B"],      students: 142, teachers: 7,  classTeacher: "Mr. Suresh Kumar",   room: "104-105", stream: "General",  color: "#8b5cf6" },
  { id: 3, name: "Class 8",  sections: ["A", "B", "C"], students: 178, teachers: 9,  classTeacher: "Ms. Kavita Singh",   room: "106-108", stream: "General",  color: "#06b6d4" },
  { id: 4, name: "Class 9",  sections: ["A", "B"],      students: 160, teachers: 10, classTeacher: "Mr. Rahul Verma",    room: "201-202", stream: "General",  color: "#10b981" },
  { id: 5, name: "Class 10", sections: ["A", "B", "C"], students: 185, teachers: 11, classTeacher: "Dr. Priya Sharma",   room: "203-205", stream: "General",  color: "#f59e0b" },
  { id: 6, name: "Class 11", sections: ["A", "B"],      students: 148, teachers: 12, classTeacher: "Ms. Deepa Nair",     room: "301-302", stream: "Science/Commerce", color: "#f43f5e" },
  { id: 7, name: "Class 12", sections: ["A", "B"],      students: 140, teachers: 12, classTeacher: "Mr. Amit Joshi",     room: "303-304", stream: "Science/Commerce", color: "#e11d48" },
];

const sectionStudents: Record<string, { id: string; name: string; roll: number; attendance: number; fees: string }[]> = {
  "6-A": [
    { id: "S001", name: "Aarav Sharma",  roll: 1, attendance: 94, fees: "Paid"    },
    { id: "S002", name: "Priya Patel",   roll: 2, attendance: 98, fees: "Paid"    },
    { id: "S003", name: "Rohan Verma",   roll: 3, attendance: 72, fees: "Pending" },
    { id: "S004", name: "Sneha Gupta",   roll: 4, attendance: 88, fees: "Paid"    },
    { id: "S005", name: "Karan Singh",   roll: 5, attendance: 65, fees: "Overdue" },
  ],
};

type SectionStudent = (typeof sectionStudents)[string][number];

/** Per-class accent, taken from the gradient utility set rather than raw hex. */
const CLASS_GRADIENTS = [
  "gradient-indigo",
  "gradient-violet",
  "gradient-cyan",
  "gradient-emerald",
  "gradient-amber",
  "gradient-rose",
  "gradient-rose",
];

const FEE_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  Paid: "success",
  Pending: "warning",
  Overdue: "danger",
};

function attendanceBar(pct: number) {
  if (pct >= 90) return "bg-success";
  if (pct >= 75) return "bg-warning";
  return "bg-danger";
}

function attendanceText(pct: number) {
  if (pct >= 90) return "text-success-text";
  if (pct >= 75) return "text-warning-text";
  return "text-danger-text";
}

export default function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const cls = classesData.find((c) => c.id === selectedClass);

  const studentColumns: Column<SectionStudent>[] = [
    {
      key: "roll",
      header: "Roll",
      sortable: true,
      render: (s) => (
        <span className="font-medium text-muted">#{String(s.roll).padStart(2, "0")}</span>
      ),
    },
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white",
              cls ? CLASS_GRADIENTS[(cls.id - 1) % CLASS_GRADIENTS.length] : "gradient-indigo"
            )}
          >
            {s.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-subtle">{s.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "attendance",
      header: "Attendance",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
            <div
              className={cn("h-full rounded-full", attendanceBar(s.attendance))}
              style={{ width: `${s.attendance}%` }}
            />
          </div>
          <span className={cn("text-xs font-semibold", attendanceText(s.attendance))}>
            {s.attendance}%
          </span>
        </div>
      ),
    },
    {
      key: "fees",
      header: "Fee Status",
      sortable: true,
      render: (s) => <Badge variant={FEE_VARIANT[s.fees] ?? "default"}>{s.fees}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            aria-label={`View ${s.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`Edit ${s.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Edit className="size-4" />
          </button>
          <button
            aria-label={`Delete ${s.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Classes & Sections"
        description="Manage classes, sections and student assignments"
        actions={
          <Button>
            <Plus className="size-4" />
            Add Class
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Classes" value="7" icon={GraduationCap} tone="indigo" />
        <StatCard label="Total Sections" value="18" icon={LayoutGrid} tone="emerald" />
        <StatCard label="Total Students" value="1,118" icon={Users} tone="amber" />
        <StatCard label="Total Teachers" value="69" icon={UserCheck} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {classesData.map((c) => {
          const isSelected = selectedClass === c.id;
          return (
            <Card
              key={c.id}
              onClick={() => {
                setSelectedClass(c.id);
                setSelectedSection(null);
              }}
              className={cn(isSelected && "border-primary shadow-md")}
            >
              <CardContent>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-sm",
                      CLASS_GRADIENTS[(c.id - 1) % CLASS_GRADIENTS.length]
                    )}
                  >
                    <GraduationCap className="size-5" />
                  </div>
                  <div className="flex gap-1">
                    {c.sections.map((s) => (
                      <span
                        key={s}
                        className="flex size-6 items-center justify-center rounded-sm bg-primary-soft text-[11px] font-bold text-primary-text"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-base font-semibold text-text">{c.name}</p>
                <p className="mt-0.5 text-xs text-muted">{c.stream}</p>

                <div className="mt-3.5 flex gap-4 border-t border-border pt-3.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <Users className="size-3.5 text-subtle" />
                    {c.students}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <BookOpen className="size-3.5 text-subtle" />
                    {c.teachers} teachers
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cls && (
        <Card>
          <CardHeader>
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-md text-white",
                  CLASS_GRADIENTS[(cls.id - 1) % CLASS_GRADIENTS.length]
                )}
              >
                <GraduationCap className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{cls.name} — Details</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  Class Teacher: {cls.classTeacher} · Room: {cls.room}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedClass(null)}>
              Close
            </Button>
          </CardHeader>

          <div className="flex flex-wrap gap-2 border-b border-border px-5 py-4">
            {cls.sections.map((sec) => {
              const key = `${cls.name.replace("Class ", "")}-${sec}`;
              const isActive = selectedSection === key;
              return (
                <Button
                  key={sec}
                  size="sm"
                  variant={isActive ? "primary" : "secondary"}
                  onClick={() => setSelectedSection(isActive ? null : key)}
                >
                  Section {sec}
                </Button>
              );
            })}
          </div>

          {selectedSection ? (
            <div>
              <div className="flex flex-wrap gap-6 border-b border-border px-5 py-4">
                {[
                  { label: "Students", value: "42", icon: Users },
                  { label: "Avg Attendance", value: "91%", icon: UserCheck },
                  { label: "Fee Collected", value: "85%", icon: BookOpen },
                ].map((info) => (
                  <div key={info.label} className="flex items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                      <info.icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold leading-none text-text">{info.value}</p>
                      <p className="mt-1 text-[11px] text-muted">{info.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Table
                columns={studentColumns}
                rows={sectionStudents[selectedSection] ?? sectionStudents["6-A"]}
                rowKey={(s) => s.id}
                className="rounded-none border-0 shadow-none"
                emptyTitle="No students in this section"
              />
            </div>
          ) : (
            <EmptyState
              icon={<ChevronDown className="size-5" />}
              title="Select a section to view students"
              description="Pick one of the section tabs above."
            />
          )}
        </Card>
      )}
    </div>
  );
}
