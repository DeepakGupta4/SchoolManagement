"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { useClassOptions } from "@/hooks/useClassOptions";
import { listStudents } from "@/lib/api/students";
import { feeStructuresApi, feeTotal, type FeeStructure } from "@/lib/api/feeStructures";
import type { Student } from "@/types/student";
import { scholarshipSchema, type ScholarshipSchema } from "@/lib/schemas/scholarship";
import {
  SCHOLARSHIP_STATUS_OPTIONS,
  SCHOLARSHIP_TYPE_OPTIONS,
  type Scholarship,
} from "@/lib/api/scholarships";

const emptyValues: ScholarshipSchema = {
  code: "",
  student: "",
  studentId: "",
  class: "",
  type: SCHOLARSHIP_TYPE_OPTIONS[0],
  percentage: 25,
  amount: 0,
  reason: "",
  status: "pending",
  since: "",
};

interface ScholarshipFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Scholarship | null;
  /** Existing scholarships — used to block a duplicate scholarship ID. */
  existing?: Scholarship[];
  saving?: boolean;
  onSubmit: (values: ScholarshipSchema) => Promise<void>;
}

export function ScholarshipFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: ScholarshipFormModalProps) {
  const isEdit = Boolean(record);
  const { classOptions } = useClassOptions();
  const [dupError, setDupError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ScholarshipSchema>({
    resolver: zodResolver(scholarshipSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record, studentId: record.studentId ?? "" } : emptyValues);
    // Deferred: clearing the duplicate error synchronously in an effect trips
    // the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Students (for the picker) and fee structures (to size the waiver) — pulled
  // when the modal opens. setState lands after the await, so it's not a sync
  // set inside the effect.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listStudents()
      .then((all) => !cancelled && setStudents(all))
      .catch(() => !cancelled && setStudents([]));
    feeStructuresApi
      .list()
      .then((all) => !cancelled && setFeeStructures(all))
      .catch(() => !cancelled && setFeeStructures([]));
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Case-insensitive set of scholarship IDs already taken by *other* records.
  // A student may hold more than one concession, so the ID is the unique key.
  const takenCodes = useMemo(() => {
    const set = new Set<string>();
    for (const s of existing) {
      if (record && s.id === record.id) continue;
      set.add(s.code.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  const studentId = useWatch({ control, name: "studentId" });
  const cls = useWatch({ control, name: "class" });
  const percentage = useWatch({ control, name: "percentage" });
  const amount = useWatch({ control, name: "amount" });

  /** The annual fee a percentage waiver is measured against, from the structure. */
  const basisFor = (className: string) => {
    const key = (className ?? "").trim().toLowerCase();
    const st = feeStructures.find((f) => f.class.trim().toLowerCase() === key);
    return st ? feeTotal(st) : 0;
  };
  const basis = basisFor(cls ?? "");

  // Student options, keeping any already-linked student selectable even if the
  // roster hasn't loaded (or they were later removed).
  const studentOptions = useMemo(() => {
    const opts = students.map((s) => ({
      label: `${s.firstName} ${s.lastName} — ${s.className} ${s.section}`,
      value: s.id,
    }));
    const currentId = (studentId as string) || "";
    if (currentId && !opts.some((o) => o.value === currentId)) {
      opts.unshift({ label: getValues("student") || "Current student", value: currentId });
    }
    return opts;
  }, [students, studentId, getValues]);

  // Class options, keeping a legacy/custom class value selectable.
  const classSelectOptions = useMemo(() => {
    const opts = [...classOptions];
    const current = (cls ?? "").trim();
    if (current && !opts.some((o) => o.value === current)) {
      opts.unshift({ label: current, value: current });
    }
    return opts;
  }, [classOptions, cls]);

  /** Recompute the waived amount from the current percentage against a basis. */
  const syncAmount = (className: string) => {
    const b = basisFor(className);
    const pct = Number(getValues("percentage")) || 0;
    if (b > 0) setValue("amount", Math.max(0, Math.round((pct / 100) * b)));
  };

  const applyStudent = (id: string) => {
    const stu = students.find((s) => s.id === id);
    if (!stu) return;
    setValue("student", `${stu.firstName} ${stu.lastName}`.trim());
    setValue("class", stu.className);
    syncAmount(stu.className);
  };

  const onPercentage = (e: ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value) || 0;
    const b = basisFor(getValues("class"));
    if (b > 0) setValue("amount", Math.max(0, Math.round((pct / 100) * b)));
  };

  const onAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const amt = Number(e.target.value) || 0;
    const b = basisFor(getValues("class"));
    if (b > 0) setValue("percentage", Math.min(100, Math.max(0, Math.round((amt / b) * 100))));
  };

  const submit = handleSubmit((values) => {
    const code = values.code.trim();
    if (takenCodes.has(code.toLowerCase())) {
      setDupError(`"${code}" already exists. Pick a different scholarship ID.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, code });
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit scholarship" : "Add scholarship"}
      description={
        isEdit
          ? "Update this concession. Changes apply immediately to the student's fees."
          : "Award a fee concession. Pick the student and the waiver reduces their payable fees."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create scholarship"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Scholarship ID"
            required
            placeholder="SCH009"
            {...register("code")}
            error={errors.code?.message ?? dupError ?? undefined}
          />
          <Select
            label="Student"
            required
            placeholder={students.length ? "Select student" : "Loading students…"}
            options={studentOptions}
            error={errors.student?.message}
            hint={
              isEdit && !studentId && record?.student
                ? `Linked to ${record.student} — pick to re-link`
                : undefined
            }
            {...register("studentId", { onChange: (e) => applyStudent(e.target.value) })}
          />
          <Select
            label="Class"
            required
            placeholder="Select class"
            options={classSelectOptions}
            {...register("class", { onChange: (e) => syncAmount(e.target.value) })}
            error={errors.class?.message}
          />
          {/* Type — pick a preset or type a custom concession type. */}
          <Input
            label="Type"
            required
            list="scholarship-type-presets"
            placeholder="Pick or type — e.g. Merit"
            {...register("type")}
            error={errors.type?.message}
          />
          <datalist id="scholarship-type-presets">
            {SCHOLARSHIP_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <Input
            label="Concession %"
            type="number"
            min={1}
            max={100}
            {...register("percentage", { onChange: onPercentage })}
            error={errors.percentage?.message}
          />
          <Input
            label="Amount waived (₹)"
            type="number"
            min={0}
            {...register("amount", { onChange: onAmount })}
            error={errors.amount?.message}
          />
          <Select
            label="Status"
            required
            options={SCHOLARSHIP_STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="Since"
            required
            placeholder="Apr 2025"
            {...register("since")}
            error={errors.since?.message}
          />
        </div>

        {basis > 0 ? (
          <p className="rounded-md bg-surface-sunken px-3 py-2 text-xs text-muted">
            Annual fee for {cls}:{" "}
            <span className="font-medium text-text">₹{basis.toLocaleString("en-IN")}</span> · waiving{" "}
            <span className="font-medium text-success-text">
              ₹{(Number(amount) || 0).toLocaleString("en-IN")}
            </span>{" "}
            ({Number(percentage) || 0}%). % and amount stay in sync.
          </p>
        ) : cls ? (
          <p className="rounded-md bg-warning-soft/50 px-3 py-2 text-xs text-warning-text">
            No fee structure for <span className="font-semibold">{cls}</span> yet — enter the amount
            and percentage manually. Add one under Fees → Fee Structure to auto-calculate.
          </p>
        ) : null}

        <Input
          label="Reason"
          required
          placeholder="School Topper"
          {...register("reason")}
          error={errors.reason?.message}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
