"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle, ClipboardList, Loader2, Percent, Save, Search, Users } from "lucide-react";
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
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { fetchAllStudents } from "@/lib/api/students";
import { examsApi, type Exam } from "@/lib/api/exams";
import { getMarks, saveMarks, type MarkRecord } from "@/lib/api/marks";
import { getMyTeacher } from "@/lib/api/teachers";
import { isValidDateString, TODAY_ISO } from "@/lib/dates";
import type { Student as ApiStudent } from "@/types/student";
import { useAuthStore } from "@/store";
import { useSchoolIdentity } from "@/lib/schoolIdentity";
import { gradeForPercent, passPercentOf, gradeToneClass } from "@/lib/grading";

type Row = { id: string; name: string; roll: number };

const toOptions = (values: string[]) => values.map((v) => ({ label: v, value: v }));

export default function MarkEntryPage() {
  const { toast } = useToast();
  const { classOptions, sectionOptions } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();
  // Grades + pass cut-off come from the school's own grading scheme.
  const { identity } = useSchoolIdentity();
  const scheme = identity.gradingScheme;
  const passPct = passPercentOf(scheme);

  // A teacher only enters marks for the classes they teach; other roles are
  // unrestricted. `isTeacher` gates all the class-scoping added below.
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher";

  // Real exams the school created power the exam picker. Full records are kept so
  // the selected exam's own date can gate mark entry.
  const [exams, setExams] = useState<Exam[]>([]);
  useEffect(() => {
    let cancelled = false;
    examsApi
      .list()
      .then((list) => {
        if (!cancelled) setExams(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const examNames = useMemo(() => exams.map((e) => e.name), [exams]);

  const [selectedClass,   setSelectedClass]   = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExam,    setSelectedExam]    = useState("");
  // maxMarks is tracked PER SUBJECT (a /100 theory and a /30 practical differ), so the
  // %/grade on screen and the saved maxMarks are always correct for the subject shown.
  const [maxBySubject, setMaxBySubject] = useState<Record<string, number>>({});
  const examDefaultTotal = exams.find((e) => e.name === selectedExam)?.totalMarks || 100;
  // The max for the subject currently on screen — the sheet shows one subject at a time,
  // so this single value correctly drives the whole visible sheet.
  const totalMarks = Math.max(1, maxBySubject[selectedSubject] ?? examDefaultTotal);

  // Default to the first real subject/exam once they load, so nothing is invented.
  useEffect(() => {
    if (!selectedSubject && subjectOptions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSubject(subjectOptions[0].value);
    }
  }, [subjectOptions, selectedSubject]);
  useEffect(() => {
    if (!selectedExam && examNames.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedExam(examNames[0]);
    }
  }, [examNames, selectedExam]);

  // Classes the signed-in teacher is allowed to enter marks for. Null means
  // "no restriction" (any non-teacher role). Loaded from the teacher's own
  // record: the classes they teach plus the one they're class-teacher of.
  const [allowedClasses, setAllowedClasses] = useState<string[] | null>(null);
  // A teacher's section scope: a class they subject-teach allows any section; their
  // class-teacher class allows only their own section (mirrors the server guard).
  const [teacherScope, setTeacherScope] = useState<{
    classes: string[];
    classTeacherOf: string;
    classTeacherSection: string;
    isClassTeacher: boolean;
  } | null>(null);
  useEffect(() => {
    if (user?.role !== "teacher") return;
    let cancelled = false;
    getMyTeacher()
      .then((t) => {
        if (cancelled) return;
        if (!t) {
          setAllowedClasses([]); // fail closed: no record → no selectable classes
          setTeacherScope(null);
          return;
        }
        const classes = (t.classes ?? []).filter((c): c is string => Boolean(c));
        const list = [...classes, t.classTeacherOf].filter((c): c is string => Boolean(c));
        setAllowedClasses([...new Set(list)]);
        setTeacherScope({
          classes,
          classTeacherOf: t.classTeacherOf ?? "",
          classTeacherSection: t.classTeacherSection ?? "",
          isClassTeacher: !!t.isClassTeacher,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setAllowedClasses([]);
          setTeacherScope(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  // A teacher's class picker is narrowed to their classes; everyone else sees all.
  const classSelectOptions =
    isTeacher && allowedClasses
      ? classOptions.filter((o) => allowedClasses.includes(o.value))
      : classOptions;

  // Auto-select an allowed class for a teacher when the current choice is empty
  // or not one of theirs, so the sheet never sits on a class they can't pick.
  useEffect(() => {
    if (!isTeacher || !allowedClasses || allowedClasses.length === 0) return;
    if (
      (!selectedClass || !allowedClasses.includes(selectedClass)) &&
      selectedClass !== allowedClasses[0]
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedClass(allowedClasses[0]);
    }
  }, [isTeacher, allowedClasses, selectedClass]);

  // Section <Select> options for a teacher: any section of a class they subject-
  // teach, but only their own section for their class-teacher class (matches the
  // server's section-lock on marks). Every other role sees all sections.
  const teacherSectionOptions = useMemo(() => {
    if (!isTeacher || !teacherScope) return sectionOptions;
    if (teacherScope.classes.includes(selectedClass)) return sectionOptions;
    if (
      teacherScope.isClassTeacher &&
      teacherScope.classTeacherOf === selectedClass &&
      teacherScope.classTeacherSection
    ) {
      return sectionOptions.filter((o) => o.value === teacherScope.classTeacherSection);
    }
    return sectionOptions;
  }, [isTeacher, teacherScope, selectedClass, sectionOptions]);

  // Snap a teacher off a section they may not enter marks for, for the chosen class.
  useEffect(() => {
    if (!isTeacher || !selectedSection) return;
    if (!teacherSectionOptions.some((o) => o.value === selectedSection)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSection(teacherSectionOptions[0]?.value ?? "");
    }
  }, [isTeacher, teacherSectionOptions, selectedSection]);

  const [roster, setRoster] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Marks are keyed by (exam, class, section, subject, student). Switching any of
  // those reveals a different sheet instead of carrying figures across.
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [savedSheet, setSavedSheet] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const sheetKey = `${selectedClass}|${selectedSection}|${selectedSubject}|${selectedExam}`;
  const markKey = (studentId: string, subject: string) =>
    `${selectedClass}|${selectedSection}|${subject}|${selectedExam}|${studentId}`;
  const markOf = (studentId: string) => marks[markKey(studentId, selectedSubject)] ?? "";
  const saved = savedSheet === sheetKey;

  // Marks load only once a specific class + section + exam are all chosen —
  // the API requires all three, so fetching with "All"/blank would 400.
  const ready = Boolean(selectedClass && selectedSection && selectedExam);

  // Marks can't be entered before the exam has taken place. Read the selected
  // exam's own date and block entry while it's still in the future (a date of
  // today or in the past is allowed). The backend enforces the same rule.
  const selectedExamDate = useMemo(
    () => exams.find((e) => e.name === selectedExam)?.date ?? "",
    [exams, selectedExam]
  );
  const examInFuture = isValidDateString(selectedExamDate) && selectedExamDate > TODAY_ISO;

  // Load the class roster (real students) + any saved marks for the exam-class.
  useEffect(() => {
    let cancelled = false;
    if (!ready) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoster([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchAllStudents({ className: selectedClass, status: "active" }),
      getMarks(selectedExam, selectedClass, selectedSection),
    ])
      .then(([students, savedMarks]) => {
        if (cancelled) return;
        const rows: Row[] = (students as ApiStudent[])
          .filter((s) => s.section === selectedSection)
          .map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`.trim(),
            roll: Number(s.rollNo) || 0,
          }))
          .sort((a, b) => a.roll - b.roll);

        // Populate the sheet for every subject that has saved marks, so switching
        // subject after load reveals the persisted figures.
        setMarks((prev) => {
          const next = { ...prev };
          for (const m of savedMarks) {
            next[
              `${selectedClass}|${selectedSection}|${m.subject}|${selectedExam}|${m.studentId}`
            ] = String(m.marks);
          }
          return next;
        });
        // Restore each subject's real maxMarks so a /30 practical doesn't render
        // against /100 (and re-saving never rewrites it to the wrong total).
        setMaxBySubject((prev) => {
          const next = { ...prev };
          for (const m of savedMarks) next[m.subject] = m.maxMarks;
          return next;
        });

        setRoster(rows);
        setSavedSheet(null);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Could not load marks", variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, selectedClass, selectedSection, selectedExam, toast]);

  const filtered = roster.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleMark = (id: string, val: string) => {
    if (examInFuture) return; // entry is locked until the exam date passes
    const num = parseInt(val);
    if (val === "" || (!isNaN(num) && num >= 0 && num <= totalMarks)) {
      setMarks((prev) => ({ ...prev, [markKey(id, selectedSubject)]: val }));
      setSavedSheet(null);
    }
  };

  const handleSave = async () => {
    if (roster.length === 0) return;
    if (examInFuture) {
      toast({
        title: "Exam hasn't taken place yet",
        description: `Marks for ${selectedExam} open after ${selectedExamDate}.`,
        variant: "warning",
      });
      return;
    }
    const records: MarkRecord[] = roster
      .filter((s) => markOf(s.id) !== "")
      .map((s) => ({
        studentId: s.id,
        studentName: s.name,
        roll: s.roll,
        subject: selectedSubject,
        marks: parseInt(markOf(s.id)) || 0,
        maxMarks: totalMarks,
      }));
    if (records.length === 0) {
      toast({ title: "Nothing to save", description: "Enter at least one mark.", variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      await saveMarks({
        examName: selectedExam,
        className: selectedClass,
        section: selectedSection,
        records,
      });
      setSavedSheet(sheetKey);
      toast({
        title: "Marks saved",
        description: `${selectedClass} · ${selectedSection} · ${selectedSubject} · ${selectedExam}`,
      });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const enteredValues = roster.map((s) => markOf(s.id)).filter((v) => v !== "");
  const entered = enteredValues.length;
  const avgMarks =
    entered > 0
      ? Math.round(enteredValues.reduce((a, b) => a + parseInt(b), 0) / entered)
      : 0;
  const passCount = enteredValues.filter(
    (v) => (parseInt(v) / totalMarks) * 100 >= passPct
  ).length;

  const columns: Column<Row>[] = [
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
        const markVal = markOf(s.id);
        const num = parseInt(markVal);
        const pct =
          markVal !== "" && !isNaN(num) ? Math.round((num / totalMarks) * 100) : null;
        const filledTone =
          pct === null
            ? undefined
            : pct >= passPct
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
        const markVal = markOf(s.id);
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
        const markVal = markOf(s.id);
        const num = parseInt(markVal);
        if (markVal === "" || isNaN(num)) return <span className="text-subtle">—</span>;
        const pct = Math.round((num / totalMarks) * 100);
        const g = gradeForPercent(scheme, pct);
        return (
          <Badge className={cn("font-semibold", gradeToneClass(g.gradePoint, pct >= passPct))}>
            {g.grade}
          </Badge>
        );
      },
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (s) => {
        const markVal = markOf(s.id);
        const num = parseInt(markVal);
        if (markVal === "" || isNaN(num)) return null;
        const pct = Math.round((num / totalMarks) * 100);
        const tone =
          pct >= 75 ? "text-success-text" : pct >= passPct ? "text-warning-text" : "text-danger-text";
        return (
          <span className={cn("text-xs font-medium", tone)}>
            {pct >= 75 ? "Excellent" : pct >= 60 ? "Good" : pct >= passPct ? "Average" : "Fail"}
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
          <Button
            onClick={handleSave}
            disabled={saving || loading || roster.length === 0 || examInFuture}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
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
            placeholder="All classes"
            options={classSelectOptions}
          />
          <Select
            label="Section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            placeholder="All sections"
            options={teacherSectionOptions}
          />
          <Select
            label="Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            placeholder="Select subject"
            options={subjectOptions}
          />
          <Select
            label="Exam"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            placeholder="Select exam"
            options={toOptions(examNames)}
          />
          <Input
            label="Total Marks"
            type="number"
            min={1}
            value={totalMarks}
            onChange={(e) =>
              setMaxBySubject((prev) => ({
                ...prev,
                [selectedSubject]: Math.max(1, parseInt(e.target.value) || examDefaultTotal),
              }))
            }
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={roster.length} icon={Users} tone="indigo" />
        <StatCard
          label="Marks Entered"
          value={`${entered}/${roster.length}`}
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
          {selectedClass} · {selectedSection} — {selectedSubject} — {selectedExam}
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

      {!ready ? (
        <div className="py-16 text-center text-sm text-muted">
          Select a <span className="font-medium text-text">class</span>,{" "}
          <span className="font-medium text-text">section</span>,{" "}
          <span className="font-medium text-text">subject</span> and{" "}
          <span className="font-medium text-text">exam</span> to start entering marks.
        </div>
      ) : examInFuture ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <CalendarClock className="size-8 text-muted" />
          <p className="text-sm font-semibold text-text">
            Mark entry is locked until the exam date
          </p>
          <p className="max-w-md text-sm text-muted">
            <span className="font-medium text-text">{selectedExam}</span> is scheduled for{" "}
            <span className="font-medium text-text">{selectedExamDate}</span>. Marks can be entered
            once that date has passed.
          </p>
        </div>
      ) : loading ? (
        <div className="grid place-items-center py-16 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : roster.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          No students in {selectedClass} · Section {selectedSection}. Add students first.
        </div>
      ) : (
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(s) => s.id}
          emptyTitle="No students found"
          emptyDescription="Try a different search term."
        />
      )}
    </div>
  );
}
