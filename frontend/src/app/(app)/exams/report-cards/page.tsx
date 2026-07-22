"use client";

import React, { useState } from "react";
import { Download, Eye, QrCode, Search } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import type { ReportCardData } from "@/components/cards/ReportCard";
import { ReportCardModal } from "./ReportCardModal";

const EXAM_NAME = "Mid-Term Examination 2025-26";
const SESSION = "2025-26";

const reportCards = [
  { id: "S001", name: "Aarav Sharma",  class: "10-A", roll: 1,  subjects: { Mathematics: 92, Physics: 88, Chemistry: 85, English: 90, Biology: 87, History: 82 }, attendance: 94, rank: 2  },
  { id: "S002", name: "Priya Patel",   class: "10-A", roll: 2,  subjects: { Mathematics: 98, Physics: 95, Chemistry: 92, English: 96, Biology: 94, History: 90 }, attendance: 98, rank: 1  },
  { id: "S003", name: "Rohan Verma",   class: "10-A", roll: 3,  subjects: { Mathematics: 65, Physics: 58, Chemistry: 62, English: 70, Biology: 60, History: 68 }, attendance: 72, rank: 18 },
  { id: "S004", name: "Sneha Gupta",   class: "10-A", roll: 4,  subjects: { Mathematics: 78, Physics: 82, Chemistry: 75, English: 85, Biology: 80, History: 77 }, attendance: 88, rank: 8  },
  { id: "S005", name: "Karan Singh",   class: "10-A", roll: 5,  subjects: { Mathematics: 45, Physics: 50, Chemistry: 48, English: 55, Biology: 42, History: 52 }, attendance: 65, rank: 38 },
  { id: "S006", name: "Ananya Joshi",  class: "10-A", roll: 6,  subjects: { Mathematics: 95, Physics: 90, Chemistry: 88, English: 92, Biology: 91, History: 89 }, attendance: 96, rank: 3  },
];

type ReportCard = (typeof reportCards)[number];

const subjectList = ["Mathematics", "Physics", "Chemistry", "English", "Biology", "History"];

/** Grade chip + progress-bar tones, expressed only in semantic tokens. */
const gradeStyle: Record<string, { chip: string; bar: string; text: string }> = {
  "A+": { chip: "bg-success-soft text-success-text", bar: "bg-success", text: "text-success-text" },
  A: { chip: "bg-info-soft text-info-text", bar: "bg-info", text: "text-info-text" },
  "B+": { chip: "bg-primary-soft text-primary-text", bar: "bg-primary", text: "text-primary-text" },
  B: { chip: "bg-warning-soft text-warning-text", bar: "bg-warning", text: "text-warning-text" },
  C: { chip: "bg-surface-hover text-muted", bar: "bg-border-strong", text: "text-muted" },
  F: { chip: "bg-danger-soft text-danger-text", bar: "bg-danger", text: "text-danger-text" },
};

function getGrade(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  return "F";
}

const MAX_TOTAL = subjectList.length * 100;

const totalOf = (s: ReportCard) => Object.values(s.subjects).reduce((a, b) => a + b, 0);
const pctOf = (s: ReportCard) => Math.round((totalOf(s) / MAX_TOTAL) * 100);

/** Maps the page's row shape onto the printable ReportCard document. */
function toReportData(s: ReportCard): ReportCardData {
  const [className, section] = s.class.split("-");
  return {
    studentName: s.name,
    admissionNo: s.id,
    rollNo: s.roll,
    className: `Class ${className}`,
    section: section ?? "A",
    fatherName: `Mr. ${s.name.split(" ").slice(-1)[0]}`,
    session: SESSION,
    examName: EXAM_NAME,
    subjects: subjectList.map((sub) => ({
      subject: sub,
      maxMarks: 100,
      obtained: s.subjects[sub as keyof typeof s.subjects],
    })),
    attendancePercent: s.attendance,
    rank: s.rank,
    classSize: 40,
  };
}

export default function ReportCardsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReportCard | null>(null);
  const [preview, setPreview] = useState<ReportCardData | null>(null);

  const filtered = reportCards.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search)
  );

  const downloadCard = (s: ReportCard) => {
    exportToCsv<{ subject: string }>(
      `report-${s.id}`,
      [
        { header: "Student", value: () => s.name },
        { header: "Class", value: () => s.class },
        { header: "Subject", value: (r) => r.subject },
        { header: "Marks", value: (r) => s.subjects[r.subject as keyof typeof s.subjects] },
        { header: "Max", value: () => 100 },
      ],
      subjectList.map((subject) => ({ subject }))
    );
    toast({ title: "Report card exported", description: `${s.name}'s marks downloaded as CSV.` });
  };

  const columns: Column<ReportCard>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-subtle">Roll #{s.roll}</p>
          </div>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      sortValue: totalOf,
      render: (s) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {totalOf(s)}/{MAX_TOTAL}
        </span>
      ),
    },
    {
      key: "percentage",
      header: "Percentage",
      sortable: true,
      sortValue: pctOf,
      render: (s) => {
        const pct = pctOf(s);
        const g = gradeStyle[getGrade(pct)];
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-hover">
              <div className={cn("h-full rounded-full", g.bar)} style={{ width: `${pct}%` }} />
            </div>
            <span className={cn("text-xs font-semibold", g.text)}>{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "grade",
      header: "Grade",
      render: (s) => {
        const grade = getGrade(pctOf(s));
        return <Badge className={cn("font-semibold", gradeStyle[grade].chip)}>{grade}</Badge>;
      },
    },
    {
      key: "rank",
      header: "Rank",
      sortable: true,
      align: "right",
      render: (s) => <span className="font-semibold text-text">#{s.rank}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setPreview(toReportData(s))}
            aria-label={`View ${s.name}'s report card`}
            title="View report card"
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => downloadCard(s)}
            aria-label={`Download ${s.name}'s report card`}
            title="Download marks (CSV)"
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
        title="Report Cards"
        description="View and download student report cards"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              exportToCsv<ReportCard>(
                "report-cards",
                [
                  { header: "Student", value: (s) => s.name },
                  { header: "Class", value: (s) => s.class },
                  { header: "Roll", value: (s) => s.roll },
                  { header: "Total", value: (s) => totalOf(s) },
                  { header: "Max", value: () => MAX_TOTAL },
                  { header: "Percentage", value: (s) => pctOf(s) },
                  { header: "Grade", value: (s) => getGrade(pctOf(s)) },
                  { header: "Rank", value: (s) => s.rank },
                  { header: "Attendance", value: (s) => s.attendance },
                ],
                filtered
              );
              toast({ title: "Exported", description: `${filtered.length} report cards downloaded.` });
            }}
          >
            <Download className="size-4" />
            Bulk export
          </Button>
        }
      />

      <div className={cn("grid grid-cols-1 gap-5", selected && "xl:grid-cols-2")}>
        <div className="flex min-w-0 flex-col gap-3">
          <Input
            type="search"
            placeholder="Search student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search students"
          />
          <Table
            columns={columns}
            rows={filtered}
            rowKey={(s) => s.id}
            onRowClick={(s) => setSelected(selected?.id === s.id ? null : s)}
            emptyTitle="No students found"
            emptyDescription="Try a different search term."
          />
        </div>

        {selected && (() => {
          const total = totalOf(selected);
          const pct = pctOf(selected);
          const grade = getGrade(pct);
          const summary = [
            { label: "Total", value: `${total}/${MAX_TOTAL}` },
            { label: "Percentage", value: `${pct}%` },
            { label: "Grade", value: grade },
            { label: "Rank", value: `#${selected.rank}` },
          ];

          return (
            <Card className="min-w-0 overflow-hidden border-primary">
              <div className="bg-primary-soft px-6 py-6 text-center">
                <Avatar name={selected.name} size="lg" className="mx-auto rounded-lg" />
                <p className="mt-3 text-lg font-semibold text-primary-text">{selected.name}</p>
                <p className="mt-1 text-xs text-primary-text">
                  Class {selected.class} · Roll #{selected.roll} · {selected.id}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-3">
                  {summary.map((info) => (
                    <div key={info.label} className="text-center">
                      <p className="text-lg font-semibold text-primary-text">{info.value}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary-text">
                        {info.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <CardContent>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Subject-wise Performance
                </p>
                <div className="flex flex-col gap-2.5">
                  {subjectList.map((sub) => {
                    const mark = selected.subjects[sub as keyof typeof selected.subjects];
                    const sg = gradeStyle[getGrade(mark)];
                    return (
                      <div key={sub} className="flex items-center gap-3">
                        <p className="w-28 shrink-0 truncate text-sm text-text">{sub}</p>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                          <div
                            className={cn("h-full rounded-full transition-all", sg.bar)}
                            style={{ width: `${mark}%` }}
                          />
                        </div>
                        <span className={cn("w-9 text-right text-sm font-semibold", sg.text)}>
                          {mark}
                        </span>
                        <Badge className={cn("w-10 justify-center font-semibold", sg.chip)}>
                          {getGrade(mark)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-3 border-t border-border pt-4">
                  <div className="flex-1 rounded-md bg-surface-sunken px-4 py-3">
                    <p className="text-xs font-medium text-muted">Attendance</p>
                    <p
                      className={cn(
                        "mt-0.5 text-xl font-semibold",
                        selected.attendance >= 75 ? "text-success-text" : "text-danger-text"
                      )}
                    >
                      {selected.attendance}%
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 rounded-md bg-surface-sunken px-4 py-3">
                    <QrCode className="size-8 text-primary" />
                    <p className="text-[10px] font-medium text-muted">Verify</p>
                  </div>
                </div>

                <Button className="mt-4 w-full" onClick={() => setPreview(toReportData(selected))}>
                  <Eye className="size-4" />
                  Open full report card
                </Button>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      <ReportCardModal data={preview} onOpenChange={(open) => !open && setPreview(null)} />
    </div>
  );
}
