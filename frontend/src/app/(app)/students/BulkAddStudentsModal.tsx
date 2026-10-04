"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ClipboardPaste, Download, Plus, Trash2, Upload } from "lucide-react";
import { Modal, Button, Input, Select, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useClassOptions } from "@/hooks/useClassOptions";
import { createStudent, fetchAllStudents } from "@/lib/api/students";
import { digitsOnly10, PHONE_REGEX } from "@/lib/phone";
import { parseTable, toCsv, downloadTextFile, normalizeDate } from "@/lib/csv";
import {
  isValidDateString,
  isWithin,
  MIN_STUDENT_DOB,
  MAX_STUDENT_DOB,
  TODAY_ISO,
} from "@/lib/dates";
import type { Gender, Student, StudentFormValues } from "@/types/student";

/** How many blank rows the table starts with. */
const INITIAL_ROWS = 5;

/** Academic year prefix for admission numbers, derived from TODAY_ISO (no `new Date()` in render). */
const ADM_YEAR = TODAY_ISO.slice(0, 4);

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

interface BulkRow {
  /** Stable React key — module counter, so no Math.random()/Date.now() in render. */
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
}

/** Per-row validation result: which fields to flag red + a combined message. */
interface RowError {
  first?: boolean;
  last?: boolean;
  dob?: boolean;
  gname?: boolean;
  phone?: boolean;
  message: string;
}

let rowSeq = 0;
const newRowId = () => `row-${rowSeq++}`;

function makeBlankRow(): BulkRow {
  return {
    id: newRowId(),
    firstName: "",
    lastName: "",
    gender: "male",
    dateOfBirth: "",
    guardianName: "",
    guardianPhone: "",
  };
}

function makeBlankRows(count: number): BulkRow[] {
  return Array.from({ length: count }, makeBlankRow);
}

/** Columns in the downloadable CSV template. */
const TEMPLATE_HEADERS = ["First Name", "Last Name", "Gender", "Date of Birth (YYYY-MM-DD)", "Guardian Name", "Guardian Phone"];

/** Heuristic: does this parsed row look like a header (not data)? */
function looksLikeHeader(row: string[]): boolean {
  return (
    row.some((c) => /first|last|surname|gender|sex|birth|dob|guardian|parent|father|mother|phone|mobile|name/i.test(c)) &&
    !row.some((c) => /^\d{4}-\d{2}-\d{2}$/.test(c) || /^\d{6,}$/.test(c))
  );
}

/**
 * Normalizes a pasted phone to its 10 significant digits. An Indian number may
 * arrive as "+91 98765 43210" or "098765 43210"; stripping the country/trunk
 * prefix and keeping the LAST 10 digits avoids front-truncating to a wrong
 * number (the old `.slice(0, 10)` turned "+919876543210" into "9198765432").
 */
function normalizePhone(raw: string): string {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(-10);
}

/** Maps a parsed CSV/TSV grid into bulk rows — header-aware, else positional. */
function mapTableToRows(table: string[][]): BulkRow[] {
  if (table.length === 0) return [];
  let header: string[] | null = null;
  let dataRows = table;
  if (looksLikeHeader(table[0])) {
    header = table[0].map((h) => h.toLowerCase());
    dataRows = table.slice(1);
  }
  // With a header, map STRICTLY by header match — a column the sheet doesn't
  // have stays -1 (blank) instead of silently stealing another column's data.
  // Positional fallbacks (0..5) apply only to a headerless paste.
  const col = (re: RegExp, fallback: number) => (header ? header.findIndex((h) => re.test(h)) : fallback);
  const iFirst = col(/first|given|student|^name$/, 0);
  const iLast = col(/last|surname|family/, 1);
  const iGender = col(/gender|sex/, 2);
  const iDob = col(/dob|birth/, 3);
  // Resolve phone FIRST, then exclude its index when finding the guardian NAME
  // column — otherwise a loose /guardian/ grabs "Guardian Phone" for the name.
  const iGPhone = header ? header.findIndex((h) => /phone|mobile|contact/.test(h)) : 5;
  const iGName = header
    ? header.findIndex((h, i) => i !== iGPhone && /guardian|parent|father|mother|name/.test(h))
    : 4;
  return dataRows.map((r) => {
    const g = (r[iGender] ?? "").trim().toLowerCase();
    const gender: Gender = g.startsWith("m") ? "male" : g.startsWith("f") ? "female" : g ? "other" : "male";
    return {
      id: newRowId(),
      firstName: (r[iFirst] ?? "").trim(),
      lastName: (r[iLast] ?? "").trim(),
      gender,
      dateOfBirth: normalizeDate(r[iDob] ?? ""),
      guardianName: (r[iGName] ?? "").trim(),
      guardianPhone: normalizePhone(r[iGPhone] ?? ""),
    };
  });
}

/** A row is skipped entirely when the user left every meaningful field blank. */
function isRowEmpty(r: BulkRow): boolean {
  return (
    !r.firstName.trim() &&
    !r.lastName.trim() &&
    !r.dateOfBirth &&
    !r.guardianName.trim() &&
    !r.guardianPhone.trim()
  );
}

/** Validates a non-empty row. Returns null when it is good to submit. */
function validateRow(r: BulkRow): RowError | null {
  const err: RowError = { message: "" };
  const problems: string[] = [];
  if (r.firstName.trim().length < 2) {
    err.first = true;
    problems.push("first name (min 2 chars)");
  }
  if (r.lastName.trim().length < 1) {
    err.last = true;
    problems.push("last name");
  }
  if (!isValidDateString(r.dateOfBirth) || !isWithin(r.dateOfBirth, MIN_STUDENT_DOB, MAX_STUDENT_DOB)) {
    err.dob = true;
    problems.push("date of birth (age 2–25)");
  }
  if (r.guardianName.trim().length < 2) {
    err.gname = true;
    problems.push("guardian name");
  }
  if (!PHONE_REGEX.test(r.guardianPhone)) {
    err.phone = true;
    problems.push("guardian phone (10 digits)");
  }
  if (problems.length === 0) return null;
  err.message = `Check ${problems.join(", ")}.`;
  return err;
}

/**
 * Starting point for school-wide admission numbers — mirrors `nextAdmissionNo`
 * in StudentFormModal. Returns the highest sequence seen plus the set of numbers
 * already in use, so the batch can increment from there without a collision.
 */
function admissionStart(students: Student[]): { seq: number; used: Set<string> } {
  const used = new Set(students.map((s) => s.admissionNo));
  let max = 0;
  for (const s of students) {
    const m = String(s.admissionNo).match(/(\d+)\s*$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return { seq: Math.max(max, students.length), used };
}

function makeAdmissionNo(seq: number): string {
  return `ADM-${ADM_YEAR}-${String(seq).padStart(4, "0")}`;
}

/** Highest roll number already used within a class + section (0 when none). */
function rollStart(students: Student[], className: string, section: string): number {
  let max = 0;
  for (const s of students) {
    if (s.className !== className || s.section !== section) continue;
    const n = parseInt(String(s.rollNo).replace(/\D/g, ""), 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return max;
}

/** Lowercase alphanumeric slug for the auto e-mail local-part. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Builds a complete StudentFormValues from a row plus the allocated numbers. */
function buildStudentValues(
  r: BulkRow,
  opts: { admissionNo: string; rollNo: string; className: string; section: string; seq: number }
): StudentFormValues {
  const firstName = r.firstName.trim();
  const lastName = r.lastName.trim();
  const phone = r.guardianPhone;
  const emailFirst = slug(firstName) || "student";
  const emailLast = slug(lastName) || "x";
  return {
    admissionNo: opts.admissionNo,
    rollNo: opts.rollNo,
    firstName,
    lastName,
    email: `${emailFirst}.${emailLast}.${opts.seq}@school.local`,
    phone,
    dateOfBirth: r.dateOfBirth,
    gender: r.gender,
    bloodGroup: undefined,
    className: opts.className,
    section: opts.section,
    status: "active",
    admissionDate: TODAY_ISO,
    address: "Address pending",
    guardian: {
      name: r.guardianName.trim() || "Parent / Guardian",
      relation: "Guardian",
      phone,
      email: "",
      occupation: "",
    },
    avatar: "",
    medicalNotes: "",
  };
}

interface BulkAddStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after at least one student is created, so the page can refetch. */
  onSaved: () => void;
}

export function BulkAddStudentsModal({ open, onOpenChange, onSaved }: BulkAddStudentsModalProps) {
  const { toast } = useToast();
  const { classOptions, sectionsFor } = useClassOptions();

  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [rows, setRows] = useState<BulkRow[]>(() => makeBlankRows(INITIAL_ROWS));
  const [rowErrors, setRowErrors] = useState<Record<string, RowError>>({});
  // Full roster, pulled once per open to derive the next admission & roll numbers.
  const [existing, setExisting] = useState<Student[]>([]);
  const [rosterReady, setRosterReady] = useState(false);
  // Roster fetch failed → numbering would start from scratch and silently
  // duplicate roll numbers, so we block the save until it loads.
  const [rosterError, setRosterError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Reset the form each time the modal opens, and pull a fresh roster.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Set synchronously so a fast (cached) roster resolve can't be clobbered by
    // the deferred reset below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRosterReady(false);
    setRosterError(false);

    // Deferred so we don't setState synchronously inside the effect.
    const t = setTimeout(() => {
      if (cancelled) return;
      setClassName("");
      setSection("");
      setRows(makeBlankRows(INITIAL_ROWS));
      setRowErrors({});
      setProgress(null);
      setSubmitting(false);
      setPasteOpen(false);
      setPasteText("");
    }, 0);

    // Fetch the WHOLE roster (every page), not a capped first 200 — admission &
    // roll numbers are derived from it, so a short read means duplicate numbers.
    fetchAllStudents()
      .then((all) => {
        if (cancelled) return;
        setExisting(all);
        setRosterReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setExisting([]);
        setRosterError(true);
        setRosterReady(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open]);

  const sections = className ? sectionsFor(className) : [];

  const onClassChange = (value: string) => {
    setClassName(value);
    // Default to the first section so the batch is ready with fewer clicks.
    setSection(sectionsFor(value)[0] ?? "");
  };

  const setRowField = (id: string, patch: Partial<BulkRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () => setRows((prev) => [...prev, makeBlankRow()]);

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));

  const addRows = (n: number) => setRows((prev) => [...prev, ...makeBlankRows(n)]);

  const downloadTemplate = () => {
    downloadTextFile(
      "students-bulk-template.csv",
      toCsv([
        TEMPLATE_HEADERS,
        ["Aarav", "Sharma", "Male", "2021-05-14", "Rajesh Sharma", "9876543210"],
        ["Diya", "Patel", "Female", "2021-08-02", "Suresh Patel", "9811122233"],
      ])
    );
    toast({ title: "Template downloaded", description: "Fill it in Excel, then upload or paste it back here." });
  };

  // Shared by file-upload and paste: parse → map → load into the grid.
  const importRows = (text: string, source: string) => {
    const mapped = mapTableToRows(parseTable(text));
    if (mapped.length === 0) {
      toast({ title: "Nothing to import", description: `No student rows found in the ${source}.`, variant: "warning" });
      return;
    }
    setRows(mapped.concat(makeBlankRows(1)));
    setRowErrors({});
    toast({
      title: `${mapped.length} row${mapped.length === 1 ? "" : "s"} loaded`,
      description: "Review the grid below, then Add students.",
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      importRows(await file.text(), "file");
    } catch {
      toast({ title: "Could not read the file", variant: "error" });
    }
  };

  const applyPaste = () => {
    if (!pasteText.trim()) { setPasteOpen(false); return; }
    importRows(pasteText, "pasted text");
    setPasteText("");
    setPasteOpen(false);
  };

  const noClasses = classOptions.length === 0;

  // Manual retry when the initial roster fetch failed — keeps typed rows intact.
  const retryRoster = () => {
    setRosterReady(false);
    setRosterError(false);
    fetchAllStudents()
      .then((all) => {
        setExisting(all);
        setRosterReady(true);
      })
      .catch(() => {
        setExisting([]);
        setRosterError(true);
        setRosterReady(true);
      });
  };

  const handleSave = async () => {
    if (rosterError) {
      toast({
        title: "Couldn't load the current roster",
        description: "Adding now could create duplicate roll numbers. Retry the roster load first.",
        variant: "error",
      });
      return;
    }
    if (!className || !section) {
      toast({
        title: "Select class and section",
        description: "The whole batch shares one class and section.",
        variant: "warning",
      });
      return;
    }

    const nonEmpty = rows.filter((r) => !isRowEmpty(r));
    if (nonEmpty.length === 0) {
      toast({
        title: "Nothing to add",
        description: "Fill in at least one student row.",
        variant: "warning",
      });
      return;
    }

    // Validate every non-empty row up front.
    const errs: Record<string, RowError> = {};
    const valid: BulkRow[] = [];
    for (const r of nonEmpty) {
      const e = validateRow(r);
      if (e) errs[r.id] = e;
      else valid.push(r);
    }
    const invalidCount = nonEmpty.length - valid.length;

    if (valid.length === 0) {
      setRowErrors(errs);
      toast({
        title: "Fix the highlighted rows",
        description: `${invalidCount} row${invalidCount === 1 ? "" : "s"} need attention.`,
        variant: "error",
      });
      return;
    }

    setSubmitting(true);
    setProgress({ done: 0, total: valid.length });

    // Allocate admission numbers (school-wide, no collisions) and roll numbers
    // (per class + section), incrementing per created student.
    const { seq: startSeq, used } = admissionStart(existing);
    let admSeq = startSeq;
    let roll = rollStart(existing, className, section);

    let created = 0;
    let processed = 0;
    const failures: Record<string, RowError> = { ...errs };

    for (const r of valid) {
      admSeq += 1;
      let admissionNo = makeAdmissionNo(admSeq);
      while (used.has(admissionNo)) {
        admSeq += 1;
        admissionNo = makeAdmissionNo(admSeq);
      }
      used.add(admissionNo);
      roll += 1;

      const values = buildStudentValues(r, {
        admissionNo,
        rollNo: String(roll),
        className,
        section,
        seq: admSeq,
      });

      try {
        await createStudent(values);
        created += 1;
      } catch (e) {
        failures[r.id] = {
          message: e instanceof Error ? e.message : "Could not save this student.",
        };
      }
      processed += 1;
      setProgress({ done: processed, total: valid.length });
    }

    setSubmitting(false);
    setProgress(null);

    const serverFailed = valid.length - created;
    const totalFailed = invalidCount + serverFailed;

    if (created > 0) onSaved();

    // Everything went in — close on full success.
    if (created === nonEmpty.length) {
      toast({
        title: "Students added",
        description: `${created} student${created === 1 ? "" : "s"} enrolled in ${className} · ${section}.`,
      });
      onOpenChange(false);
      return;
    }

    // Partial (or total) failure: keep the modal open with only the rows that
    // still need attention, so a retry can't duplicate the ones already created.
    setRowErrors(failures);
    const failedIds = new Set(Object.keys(failures));
    setRows((prev) => {
      const remaining = prev.filter((r) => failedIds.has(r.id) || isRowEmpty(r));
      return remaining.length > 0 ? remaining : [makeBlankRow()];
    });

    if (created > 0) {
      // Refresh the roster so retries get correct, non-colliding numbers.
      try {
        const all = await fetchAllStudents();
        setExisting(all);
      } catch {
        /* keep the stale roster; the unique index still guards collisions */
      }
      toast({
        title: `${created} added, ${totalFailed} not added`,
        description: "Fix the highlighted rows and try again.",
        variant: "warning",
      });
    } else {
      toast({
        title: "Could not add students",
        description: `${totalFailed} row${totalFailed === 1 ? "" : "s"} failed. See the details below.`,
        variant: "error",
      });
    }
  };

  const th = "px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Bulk add students"
      description="Add many students at once — upload a CSV, paste from Excel, or type rows. The whole batch shares one class and section; admission and roll numbers are assigned automatically."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting || !rosterReady || rosterError || noClasses}>
            {submitting
              ? progress
                ? `Adding ${progress.done}/${progress.total}…`
                : "Adding…"
              : "Add students"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {rosterError && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-danger-soft/50 px-3 py-2">
            <p className="text-xs text-danger-text">
              Couldn&apos;t load the current roster — admission &amp; roll numbers can&apos;t be assigned
              safely, so adding is paused. Retry before continuing.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={retryRoster} disabled={!rosterReady}>
              Retry
            </Button>
          </div>
        )}
        {noClasses ? (
          <p className="rounded-md bg-warning-soft/50 px-3 py-2 text-xs text-warning-text">
            No classes yet — create a class in{" "}
            <span className="font-semibold">Classes &amp; Sections</span> first, then bulk-add
            students into it.
          </p>
        ) : (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-subtle">
              Class &amp; section (applies to every row)
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Class"
                required
                placeholder="Select class"
                options={classOptions}
                value={className}
                onChange={(e) => onClassChange(e.target.value)}
              />
              <Select
                label="Section"
                required
                placeholder={className ? "Select section" : "Pick a class first"}
                options={sections.map((s) => ({ label: s, value: s }))}
                value={section}
                onChange={(e) => setSection(e.target.value)}
                disabled={!className}
              />
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Students</p>
            <span className="text-xs text-subtle">
              {rows.filter((r) => !isRowEmpty(r)).length} filled · {rows.length} rows
            </span>
          </div>

          {/* Import toolbar — the industry way: template → fill in Excel → upload/paste */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} disabled={submitting}>
              <Download className="size-4" />
              Template
            </Button>
            <label className="focus-within:outline-none">
              <span
                className={cn(
                  "focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-hover",
                  submitting && "pointer-events-none opacity-50"
                )}
              >
                <Upload className="size-4" />
                Upload CSV
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="sr-only"
                disabled={submitting}
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => setPasteOpen((o) => !o)} disabled={submitting}>
              <ClipboardPaste className="size-4" />
              Paste from Excel
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addRows(10)} disabled={submitting}>
              <Plus className="size-4" />
              Add 10 rows
            </Button>
          </div>

          {pasteOpen && (
            <div className="mb-3 rounded-lg border border-border bg-surface-sunken p-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                placeholder="Paste rows copied from Excel / Google Sheets — columns: First name, Last name, Gender, Date of birth, Guardian name, Guardian phone (a header row is optional)."
                className="focus-ring w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtle"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setPasteOpen(false); setPasteText(""); }}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={applyPaste} disabled={!pasteText.trim()}>
                  Load rows
                </Button>
              </div>
            </div>
          )}

          <div className="max-h-[42vh] overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken">
                  <th className={cn(th, "w-8 text-center")}>#</th>
                  <th className={th}>First name</th>
                  <th className={th}>Last name</th>
                  <th className={th}>Gender</th>
                  <th className={th}>Date of birth</th>
                  <th className={th}>Guardian name</th>
                  <th className={th}>Guardian phone</th>
                  <th className={cn(th, "w-10")} aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const err = rowErrors[row.id];
                  return (
                    <Fragment key={row.id}>
                      <tr className="border-b border-border last:border-0 align-top">
                        <td className="px-2.5 py-2 text-center text-xs text-subtle">{i + 1}</td>
                        <td className="px-1.5 py-2">
                          <Input
                            aria-label={`Row ${i + 1} first name`}
                            placeholder="First"
                            value={row.firstName}
                            disabled={submitting}
                            className={cn(err?.first && "border-danger")}
                            onChange={(e) => setRowField(row.id, { firstName: e.target.value })}
                          />
                        </td>
                        <td className="px-1.5 py-2">
                          <Input
                            aria-label={`Row ${i + 1} last name`}
                            placeholder="Last"
                            value={row.lastName}
                            disabled={submitting}
                            className={cn(err?.last && "border-danger")}
                            onChange={(e) => setRowField(row.id, { lastName: e.target.value })}
                          />
                        </td>
                        <td className="px-1.5 py-2">
                          <Select
                            aria-label={`Row ${i + 1} gender`}
                            options={GENDER_OPTIONS}
                            value={row.gender}
                            disabled={submitting}
                            onChange={(e) =>
                              setRowField(row.id, { gender: e.target.value as Gender })
                            }
                          />
                        </td>
                        <td className="px-1.5 py-2">
                          <Input
                            aria-label={`Row ${i + 1} date of birth`}
                            type="date"
                            min={MIN_STUDENT_DOB}
                            max={MAX_STUDENT_DOB}
                            value={row.dateOfBirth}
                            disabled={submitting}
                            className={cn(err?.dob && "border-danger")}
                            onChange={(e) => setRowField(row.id, { dateOfBirth: e.target.value })}
                          />
                        </td>
                        <td className="px-1.5 py-2">
                          <Input
                            aria-label={`Row ${i + 1} guardian name`}
                            placeholder="Guardian"
                            value={row.guardianName}
                            disabled={submitting}
                            className={cn(err?.gname && "border-danger")}
                            onChange={(e) => setRowField(row.id, { guardianName: e.target.value })}
                          />
                        </td>
                        <td className="px-1.5 py-2">
                          <Input
                            aria-label={`Row ${i + 1} guardian phone`}
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="9876543210"
                            value={row.guardianPhone}
                            disabled={submitting}
                            className={cn(err?.phone && "border-danger")}
                            onChange={(e) => {
                              digitsOnly10(e);
                              setRowField(row.id, { guardianPhone: e.target.value });
                            }}
                          />
                        </td>
                        <td className="px-1.5 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={submitting || rows.length <= 1}
                            aria-label={`Remove row ${i + 1}`}
                            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-subtle"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                      {err?.message && (
                        <tr className="border-b border-border last:border-0">
                          <td />
                          <td colSpan={7} className="px-1.5 pb-2 text-xs text-danger">
                            {err.message}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <Button type="button" variant="outline" onClick={addRow} disabled={submitting}>
              <Plus className="size-4" />
              Add row
            </Button>
          </div>

          <p className="mt-3 text-xs text-subtle">
            Tip: download the <span className="font-medium text-text">Template</span>, fill it in Excel, then{" "}
            <span className="font-medium text-text">Upload CSV</span> or <span className="font-medium text-text">Paste from Excel</span>.
            Empty rows are skipped. Admission no., roll no. and a placeholder e-mail are generated
            automatically; the guardian phone is used as the student&apos;s contact number. Any detail
            can be edited later from the student&apos;s profile.
          </p>
        </section>
      </div>
    </Modal>
  );
}
