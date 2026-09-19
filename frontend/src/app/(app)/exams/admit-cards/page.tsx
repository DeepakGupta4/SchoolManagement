"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, FileText, Printer, Search, Square, TriangleAlert, Users } from "lucide-react";
import {
  Badge, Button, Card, EmptyState, Input, PageHeader, Select, Skeleton, StatCard, useToast,
} from "@/components/ui";
import { AdmitCard, type AdmitCardData, type AdmitCardSubject } from "@/components/cards/AdmitCard";
import { useAsyncList } from "@/hooks/useAsyncList";
import { useClassOptions } from "@/hooks/useClassOptions";
import { listStudents } from "@/lib/api/students";
import { examsApi } from "@/lib/api/exams";
import { examScheduleApi, type ScheduledExam } from "@/lib/api/examSchedule";
import { fullName, type Student } from "@/types/student";

// School-level constants shown on every card — not per-student data.
const SESSION = "2025-26";
const CENTRE_CODE = "DL-0731";
const CENTRE_NAME = "Springdale School, Mayur Vihar";

/** Maps a student's class + section onto the schedule's class code, e.g. "10-A". */
function classCode(s: Student) {
  return `${s.className.replace(/^Class\s+/i, "").trim()}-${s.section}`;
}

/** Derives the weekday name from a schedule date string; "" if unparseable. */
function weekday(date: string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { weekday: "long" });
}

/** Turns a scheduled-exam row into an admit-card timetable line. */
function toSubject(row: ScheduledExam): AdmitCardSubject {
  return {
    subject: row.subject,
    date: row.date,
    day: weekday(row.date),
    timing: row.duration ? `${row.time} · ${row.duration}` : row.time,
    room: row.room,
  };
}

export default function AdmitCardsPage() {
  const { toast } = useToast();
  const { classOptions } = useClassOptions();

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [exam, setExam] = useState("");
  const [onlyEligible, setOnlyEligible] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Real students, filtered server-side by class + search — the same source the
  // student ID-cards page uses, so photos flow through automatically.
  const studentsFetcher = useCallback(
    () => listStudents({ search, className }),
    [search, className]
  );
  const { items: students, loading: studentsLoading } = useAsyncList<Student>(studentsFetcher);

  // Real exam schedule, loaded in full so we can group papers by class + exam.
  const scheduleFetcher = useCallback(() => examScheduleApi.list(), []);
  const { items: schedule, loading: scheduleLoading } = useAsyncList<ScheduledExam>(scheduleFetcher);

  const loading = studentsLoading || scheduleLoading;

  // Real exams the school created power the exam selector.
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

  // Default to the first available exam once they load.
  useEffect(() => {
    if (!exam && examNames.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExam(examNames[0]);
    }
  }, [examNames, exam]);

  // Papers scheduled for the selected exam, indexed by class code.
  const subjectsByClass = useMemo(() => {
    const map = new Map<string, AdmitCardSubject[]>();
    for (const row of schedule) {
      if (exam && row.exam !== exam) continue;
      const list = map.get(row.class) ?? [];
      list.push(toSubject(row));
      map.set(row.class, list);
    }
    return map;
  }, [schedule, exam]);

  // A candidate is a student whose class has papers scheduled for this exam.
  const candidates = useMemo(() => {
    return students
      .map((s) => {
        const subjects = subjectsByClass.get(classCode(s)) ?? [];
        const card: AdmitCardData & { feeCleared: boolean } = {
          id: s.id,
          studentName: fullName(s),
          rollNo: s.rollNo,
          admissionNo: s.admissionNo,
          className: s.className,
          section: s.section,
          examName: exam,
          session: SESSION,
          centreCode: CENTRE_CODE,
          centreName: CENTRE_NAME,
          fatherName: s.guardian.name,
          photo: s.avatar || undefined,
          subjects,
          // Schools withhold admit cards over unpaid fees.
          feeCleared: (s.feeDue ?? 0) <= 0,
        };
        return card;
      })
      .filter((c) => c.subjects.length > 0);
  }, [students, subjectsByClass, exam]);

  const filtered = useMemo(
    () => (onlyEligible ? candidates.filter((c) => c.feeCleared) : candidates),
    [candidates, onlyEligible]
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      // Set is mutable, so it must be cloned before mutating or React sees no change.
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });

  const printCount = selected.size > 0 ? selected.size : filtered.length;
  const blockedCount = candidates.filter((c) => !c.feeCleared).length;

  const handlePrint = () => {
    if (printCount === 0) {
      toast({ title: "Nothing to print", description: "No candidates match the current filters.", variant: "warning" });
      return;
    }
    toast({
      title: `Preparing ${printCount} admit card${printCount > 1 ? "s" : ""}`,
      description: "Your browser's print dialog will open.",
    });
    setTimeout(() => window.print(), 250);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="print-hide flex flex-col gap-5">
        <PageHeader
          title="Admit Cards"
          description="Generate and print examination admit cards."
          actions={
            <Button onClick={handlePrint}>
              <Printer className="size-4" />
              Print {selected.size > 0 ? `${selected.size} selected` : "all shown"}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total candidates" value={candidates.length} icon={Users} tone="indigo" />
          <StatCard
            label="Eligible"
            value={candidates.length - blockedCount}
            icon={FileText}
            tone="emerald"
            sub="Fees cleared"
          />
          <StatCard
            label="Withheld"
            value={blockedCount}
            icon={TriangleAlert}
            tone="rose"
            sub="Pending fees"
          />
          <StatCard label="Selected" value={selected.size} icon={CheckSquare} tone="violet" />
        </div>

        {blockedCount > 0 && (
          <Card className="border-warning">
            <div className="flex items-start gap-3 px-5 py-4">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-sm text-muted">
                <span className="font-medium text-text">{blockedCount} students</span> have pending fees and are
                withheld from admit-card generation. Turn off &ldquo;Eligible only&rdquo; to review them.
              </p>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-60 flex-1">
            <Input
              type="search"
              placeholder="Search by name, roll no. or admission no.…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="size-4" />}
              aria-label="Search candidates"
            />
          </div>
          <div className="w-64">
            <Select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              placeholder="Select examination"
              options={examNames.map((x) => ({ label: x, value: x }))}
              aria-label="Select examination"
            />
          </div>
          <div className="w-40">
            <Select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="All classes"
              options={classOptions}
              aria-label="Filter by class"
            />
          </div>
          <Button
            variant={onlyEligible ? "primary" : "outline"}
            onClick={() => setOnlyEligible((v) => !v)}
            aria-pressed={onlyEligible}
          >
            Eligible only
          </Button>
          <Button variant="outline" onClick={toggleAll} disabled={filtered.length === 0}>
            {allVisibleSelected ? <Square className="size-4" /> : <CheckSquare className="size-4" />}
            {allVisibleSelected ? "Clear selection" : "Select all"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[1/1.414] w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="print-hide">
          <EmptyState
            icon={<FileText className="size-5" />}
            title="No candidates found"
            description="Try clearing the filters or turning off “Eligible only”."
          />
        </Card>
      ) : (
        <div className="print-sheet grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const isSelected = selected.has(c.id);
            const dimmed = selected.size > 0 && !isSelected;
            return (
              <div key={c.id} className={dimmed ? "print-hide" : undefined}>
                <button
                  onClick={() => toggle(c.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select admit card for ${c.studentName}`}
                  className="focus-ring print-hide mb-2 flex w-full items-center gap-2 rounded-md px-1 text-left text-xs text-muted transition-colors hover:text-text"
                >
                  {isSelected ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4" />
                  )}
                  <span className="truncate">
                    {c.studentName} · Roll {c.rollNo}
                  </span>
                  {!c.feeCleared && (
                    <Badge variant="danger" className="ml-auto shrink-0">
                      Fees due
                    </Badge>
                  )}
                </button>
                <AdmitCard data={{ ...c, examName: exam }} />
              </div>
            );
          })}
        </div>
      )}

      <p className="print-hide text-xs text-subtle">
        Admit cards render at A5 portrait (148 × 210 mm). The QR block is a visual placeholder — it is not yet scannable.
      </p>
    </div>
  );
}
