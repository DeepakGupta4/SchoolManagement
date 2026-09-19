"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, Eye, Loader2, QrCode, Search } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  Select,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import type { ReportCardData } from "@/components/cards/ReportCard";
import { ReportCardModal } from "./ReportCardModal";
import { useClassOptions } from "@/hooks/useClassOptions";
import { listStudents } from "@/lib/api/students";
import { examsApi } from "@/lib/api/exams";
import { getMarks } from "@/lib/api/marks";
import type { Student as ApiStudent } from "@/types/student";

const SESSION = "2025-26";

// Preferred display order for subjects; anything else falls in after these.
const SUBJECT_ORDER = ["Mathematics", "Physics", "Chemistry", "English", "Biology", "History"];

type ReportSubject = { subject: string; maxMarks: number; obtained: number };

type Report = {
  id: string;
  name: string;
  roll: number;
  className: string;
  section: string;
  admissionNo: string;
  fatherName: string;
  attendance: number;
  subjects: ReportSubject[];
  total: number;
  maxTotal: number;
  pct: number;
  rank: number;
};

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

const toOptions = (values: string[]) => values.map((v) => ({ label: v, value: v }));

const subjectRank = (name: string) => {
  const i = SUBJECT_ORDER.indexOf(name);
  return i === -1 ? SUBJECT_ORDER.length : i;
};

export default function ReportCardsPage() {
  const { toast } = useToast();
  const { classOptions, sectionOptions } = useClassOptions();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedExam, setSelectedExam] = useState("");

  // Real exams the school created power the exam picker.
  const [examNames, setExamNames] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    examsApi
      .list()
      .then((exams) => {
        if (!cancelled) setExamNames(exams.map((e) => e.name));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!selectedExam && examNames.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedExam(examNames[0]);
    }
  }, [examNames, selectedExam]);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReportCardData | null>(null);

  // Build each student's report from real students + saved marks.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      listStudents({ className: selectedClass }),
      getMarks(selectedExam, selectedClass, selectedSection),
    ])
      .then(([students, marks]) => {
        if (cancelled) return;
        const cohort = (students as ApiStudent[]).filter((s) => s.section === selectedSection);

        const built: Report[] = cohort
          .map((s) => {
            const own = marks
              .filter((m) => m.studentId === s.id)
              .map<ReportSubject>((m) => ({
                subject: m.subject,
                maxMarks: m.maxMarks || 100,
                obtained: m.marks,
              }))
              .sort((a, b) => subjectRank(a.subject) - subjectRank(b.subject));

            const total = own.reduce((a, x) => a + x.obtained, 0);
            const maxTotal = own.reduce((a, x) => a + x.maxMarks, 0);
            const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

            return {
              id: s.id,
              name: `${s.firstName} ${s.lastName}`.trim(),
              roll: Number(s.rollNo) || 0,
              className: s.className,
              section: s.section,
              admissionNo: s.admissionNo,
              fatherName: s.guardian?.name || "—",
              attendance: Math.round(s.attendancePercent ?? 0),
              subjects: own,
              total,
              maxTotal,
              pct,
              rank: 0,
            };
          })
          .sort((a, b) => b.total - a.total)
          .map((r, i) => ({ ...r, rank: i + 1 }))
          .sort((a, b) => a.roll - b.roll);

        setReports(built);
        setSelectedId(null);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Could not load report cards", variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedSection, selectedExam, toast]);

  const classSize = reports.length;

  const filtered = reports.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) || s.admissionNo.includes(search)
  );

  const selected = useMemo(
    () => reports.find((r) => r.id === selectedId) ?? null,
    [reports, selectedId]
  );

  /** Maps a computed report onto the printable ReportCard document. */
  const toReportData = (s: Report): ReportCardData => ({
    studentName: s.name,
    admissionNo: s.admissionNo,
    rollNo: s.roll,
    className: s.className,
    section: s.section,
    fatherName: s.fatherName,
    session: SESSION,
    examName: selectedExam,
    subjects: s.subjects.map((sub) => ({
      subject: sub.subject,
      maxMarks: sub.maxMarks,
      obtained: sub.obtained,
    })),
    attendancePercent: s.attendance,
    rank: s.rank,
    classSize,
  });

  const downloadCard = (s: Report) => {
    exportToCsv<ReportSubject>(
      `report-${s.admissionNo}`,
      [
        { header: "Student", value: () => s.name },
        { header: "Class", value: () => `${s.className} ${s.section}` },
        { header: "Subject", value: (r) => r.subject },
        { header: "Marks", value: (r) => r.obtained },
        { header: "Max", value: (r) => r.maxMarks },
      ],
      s.subjects
    );
    toast({ title: "Report card exported", description: `${s.name}'s marks downloaded as CSV.` });
  };

  const columns: Column<Report>[] = [
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
      sortValue: (s) => s.total,
      render: (s) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {s.total}/{s.maxTotal || 0}
        </span>
      ),
    },
    {
      key: "percentage",
      header: "Percentage",
      sortable: true,
      sortValue: (s) => s.pct,
      render: (s) => {
        const g = gradeStyle[getGrade(s.pct)];
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-hover">
              <div className={cn("h-full rounded-full", g.bar)} style={{ width: `${s.pct}%` }} />
            </div>
            <span className={cn("text-xs font-semibold", g.text)}>{s.pct}%</span>
          </div>
        );
      },
    },
    {
      key: "grade",
      header: "Grade",
      render: (s) => {
        const grade = getGrade(s.pct);
        return <Badge className={cn("font-semibold", gradeStyle[grade].chip)}>{grade}</Badge>;
      },
    },
    {
      key: "rank",
      header: "Rank",
      sortable: true,
      align: "right",
      sortValue: (s) => s.rank,
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
              exportToCsv<Report>(
                "report-cards",
                [
                  { header: "Student", value: (s) => s.name },
                  { header: "Class", value: (s) => `${s.className} ${s.section}` },
                  { header: "Roll", value: (s) => s.roll },
                  { header: "Total", value: (s) => s.total },
                  { header: "Max", value: (s) => s.maxTotal },
                  { header: "Percentage", value: (s) => s.pct },
                  { header: "Grade", value: (s) => getGrade(s.pct) },
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

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Select
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              placeholder="All classes"
              options={classOptions}
            />
          </div>
          <div className="w-32">
            <Select
              label="Section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              placeholder="All sections"
              options={sectionOptions}
            />
          </div>
          <div className="w-48">
            <Select
              label="Exam"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              placeholder="Select exam"
              options={toOptions(examNames)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid place-items-center py-16 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          No students in {selectedClass} · Section {selectedSection}. Add students first.
        </div>
      ) : (
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
              onRowClick={(s) => setSelectedId(selectedId === s.id ? null : s.id)}
              emptyTitle="No students found"
              emptyDescription="Try a different search term."
            />
          </div>

          {selected && (() => {
            const pct = selected.pct;
            const grade = getGrade(pct);
            const summary = [
              { label: "Total", value: `${selected.total}/${selected.maxTotal || 0}` },
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
                    {selected.className} · {selected.section} · Roll #{selected.roll} ·{" "}
                    {selected.admissionNo}
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
                  {selected.subjects.length === 0 ? (
                    <p className="text-sm text-muted">No marks entered for this exam yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {selected.subjects.map((sub) => {
                        const sp =
                          sub.maxMarks > 0 ? Math.round((sub.obtained / sub.maxMarks) * 100) : 0;
                        const sg = gradeStyle[getGrade(sp)];
                        return (
                          <div key={sub.subject} className="flex items-center gap-3">
                            <p className="w-28 shrink-0 truncate text-sm text-text">{sub.subject}</p>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                              <div
                                className={cn("h-full rounded-full transition-all", sg.bar)}
                                style={{ width: `${sp}%` }}
                              />
                            </div>
                            <span className={cn("w-9 text-right text-sm font-semibold", sg.text)}>
                              {sub.obtained}
                            </span>
                            <Badge className={cn("w-10 justify-center font-semibold", sg.chip)}>
                              {getGrade(sp)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}

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
      )}

      <ReportCardModal data={preview} onOpenChange={(open) => !open && setPreview(null)} />
    </div>
  );
}
