"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal, Button, Input, Select, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useClassOptions } from "@/hooks/useClassOptions";
import { createStudent, listStudents } from "@/lib/api/students";
import { digitsOnly10, PHONE_REGEX } from "@/lib/phone";
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
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Reset the form each time the modal opens, and pull a fresh roster.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Set synchronously so a fast (cached) roster resolve can't be clobbered by
    // the deferred reset below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRosterReady(false);

    // Deferred so we don't setState synchronously inside the effect.
    const t = setTimeout(() => {
      if (cancelled) return;
      setClassName("");
      setSection("");
      setRows(makeBlankRows(INITIAL_ROWS));
      setRowErrors({});
      setProgress(null);
      setSubmitting(false);
    }, 0);

    listStudents()
      .then((all) => {
        if (cancelled) return;
        setExisting(all);
        setRosterReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setExisting([]);
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

  const noClasses = classOptions.length === 0;

  const handleSave = async () => {
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
        const all = await listStudents();
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
      description="Add several students at once. The whole batch shares one class and section; admission and roll numbers are assigned automatically."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting || !rosterReady || noClasses}>
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

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
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
            Empty rows are skipped. Admission no., roll no. and a placeholder e-mail are generated
            automatically; the guardian phone is used as the student&apos;s contact number. You can
            edit any detail later from the student&apos;s profile.
          </p>
        </section>
      </div>
    </Modal>
  );
}
