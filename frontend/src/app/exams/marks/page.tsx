"use client";

import React, { useState } from "react";
import { CheckCircle, ClipboardList, Percent, Save, Search, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const subjects = ["Mathematics", "Physics", "Chemistry", "English", "Biology", "History"];
const classes  = ["6-A", "7-A", "8-A", "9-A", "9-B", "10-A", "10-B", "11-A", "12-A"];
const exams    = ["Unit Test 1", "Mid-Term Exam", "Final Exam"];

const studentsData = [
  { id: "S001", name: "Aarav Sharma",  roll: 1  },
  { id: "S002", name: "Priya Patel",   roll: 2  },
  { id: "S003", name: "Rohan Verma",   roll: 3  },
  { id: "S004", name: "Sneha Gupta",   roll: 4  },
  { id: "S005", name: "Karan Singh",   roll: 5  },
  { id: "S006", name: "Ananya Joshi",  roll: 6  },
  { id: "S007", name: "Vikram Nair",   roll: 7  },
  { id: "S008", name: "Meera Iyer",    roll: 8  },
  { id: "S009", name: "Arjun Reddy",   roll: 9  },
  { id: "S010", name: "Pooja Mishra",  roll: 10 },
];

type Student = (typeof studentsData)[number];

/** Grade chip tones, expressed only in semantic tokens. */
const gradeClass: Record<string, string> = {
  "A+": "bg-success-soft text-success-text",
  A: "bg-info-soft text-info-text",
  "B+": "bg-primary-soft text-primary-text",
  B: "bg-warning-soft text-warning-text",
  C: "bg-surface-hover text-muted",
  F: "bg-danger-soft text-danger-text",
};

function getGrade(mark: number, total: number) {
  const pct = (mark / total) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  return "F";
}

const toOptions = (values: string[]) => values.map((v) => ({ label: v, value: v }));

export default function MarkEntryPage() {
  const [selectedClass,   setSelectedClass]   = useState("10-A");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedExam,    setSelectedExam]    = useState("Mid-Term Exam");
  const [totalMarks,      setTotalMarks]      = useState(100);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = studentsData.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleMark = (id: string, val: string) => {
    const num = parseInt(val);
    if (val === "" || (!isNaN(num) && num >= 0 && num <= totalMarks)) {
      setMarks((prev) => ({ ...prev, [id]: val }));
      setSaved(false);
    }
  };

  const enteredValues = Object.values(marks).filter((v) => v !== "");
  const entered = enteredValues.length;
  const avgMarks =
    entered > 0
      ? Math.round(enteredValues.reduce((a, b) => a + parseInt(b), 0) / entered)
      : 0;
  const passCount = enteredValues.filter(
    (v) => (parseInt(v) / totalMarks) * 100 >= 33
  ).length;

  const columns: Column<Student>[] = [
    {
      key: "roll",
      header: "Roll",
      render: (s) => (
        <span className="whitespace-nowrap font-medium text-muted">
          #{String(s.roll).padStart(2, "0")}
        </span>
      ),
    },
    {
      key: "name",
      header: "Student",
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-subtle">{s.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "marks",
      header: `Marks (out of ${totalMarks})`,
      render: (s) => {
        const markVal = marks[s.id] ?? "";
        const num = parseInt(markVal);
        const pct =
          markVal !== "" && !isNaN(num) ? Math.round((num / totalMarks) * 100) : null;
        const filledTone =
          pct === null
            ? undefined
            : pct >= 33
              ? "border-success bg-success-soft"
              : "border-danger bg-danger-soft";
        return (
          <Input
            type="number"
            value={markVal}
            onChange={(e) => handleMark(s.id, e.target.value)}
            placeholder={`0 - ${totalMarks}`}
            aria-label={`Marks for ${s.name}`}
            className={cn("w-28 text-center font-semibold", filledTone)}
          />
        );
      },
    },
    {
      key: "percentage",
      header: "Percentage",
      render: (s) => {
        const markVal = marks[s.id] ?? "";
        const num = parseInt(markVal);
        const pct =
          markVal !== "" && !isNaN(num) ? Math.round((num / totalMarks) * 100) : null;
        if (pct === null) return <span className="text-subtle">—</span>;
        const bar = pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger";
        const label =
          pct >= 75 ? "text-success-text" : pct >= 50 ? "text-warning-text" : "text-danger-text";
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
              <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
            </div>
            <span className={cn("text-xs font-semibold", label)}>{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "grade",
      header: "Grade",
      render: (s) => {
        const markVal = marks[s.id] ?? "";
        const num = parseInt(markVal);
        if (markVal === "" || isNaN(num)) return <span className="text-subtle">—</span>;
        const grade = getGrade(num, totalMarks);
        return (
          <Badge className={cn("font-semibold", gradeClass[grade])}>{grade}</Badge>
        );
      },
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (s) => {
        const markVal = marks[s.id] ?? "";
        const num = parseInt(markVal);
        if (markVal === "" || isNaN(num)) return null;
        const pct = Math.round((num / totalMarks) * 100);
        const tone =
          pct >= 75 ? "text-success-text" : pct >= 33 ? "text-warning-text" : "text-danger-text";
        return (
          <span className={cn("text-xs font-medium", tone)}>
            {pct >= 75 ? "Excellent" : pct >= 60 ? "Good" : pct >= 33 ? "Average" : "Fail"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Mark Entry"
        description="Enter and manage student marks"
        actions={
          <Button onClick={() => setSaved(true)}>
            <Save className="size-4" />
            Save Marks
          </Button>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={toOptions(classes)}
          />
          <Select
            label="Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            options={toOptions(subjects)}
          />
          <Select
            label="Exam"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            options={toOptions(exams)}
          />
          <Input
            label="Total Marks"
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={studentsData.length} icon={Users} tone="indigo" />
        <StatCard
          label="Marks Entered"
          value={`${entered}/${studentsData.length}`}
          icon={ClipboardList}
          tone="cyan"
        />
        <StatCard
          label="Class Average"
          value={entered > 0 ? `${avgMarks}/${totalMarks}` : "—"}
          icon={Percent}
          tone="amber"
        />
        <StatCard
          label="Pass Count"
          value={entered > 0 ? passCount : "—"}
          icon={CheckCircle}
          tone="emerald"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-text">
          {selectedClass} — {selectedSubject} — {selectedExam}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-text">
              <CheckCircle className="size-4" />
              Marks saved!
            </span>
          )}
          <div className="w-52">
            <Input
              type="search"
              placeholder="Search student…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="size-4" />}
              aria-label="Search students"
            />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        emptyTitle="No students found"
        emptyDescription="Try a different search term."
      />
    </div>
  );
}
