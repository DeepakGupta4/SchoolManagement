"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, MultiSelect } from "@/components/ui";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { listStudents } from "@/lib/api/students";
import type { Student } from "@/types/student";
import { examSchema, type ExamSchema } from "@/lib/schemas/exam";
import { EXAM_STATUS_OPTIONS, EXAM_TYPE_OPTIONS, type Exam } from "@/lib/api/exams";

const EXAM_NAME_PRESETS = [
  "Unit Test 1", "Unit Test 2", "Mid-Term Examination", "Half-Yearly Examination",
  "Pre-Board Examination", "Practical Examination", "Final Examination", "Annual Examination",
];
const DURATION_OPTIONS = ["45 min", "1 hr", "1.5 hrs", "2 hrs", "2.5 hrs", "3 hrs"];
const TIME_PRESETS = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "12:00 PM", "2:00 PM"];

/** Module-scope (not render) so it isn't flagged as an impure render call. */
function genExamCode() {
  return `EX-${Math.floor(1000 + Math.random() * 9000)}`;
}

const emptyValues: ExamSchema = {
  code: "",
  name: "",
  type: EXAM_TYPE_OPTIONS[0],
  classes: [],
  subject: "",
  date: "",
  time: "10:00 AM",
  duration: "1 hr",
  totalMarks: 25,
  status: "upcoming",
  students: 0,
};

interface ExamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Exam | null;
  saving?: boolean;
  onSubmit: (values: ExamSchema) => Promise<void>;
}

export function ExamFormModal({ open, onOpenChange, record, saving, onSubmit }: ExamFormModalProps) {
  const isEdit = Boolean(record);
  const { classNames } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();

  const [roster, setRoster] = useState<Student[]>([]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listStudents()
      .then((s) => !cancelled && setRoster(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: emptyValues,
  });

  const selectedClasses = useWatch({ control, name: "classes" });
  // Students appearing for the exam = active students in the selected classes.
  const derivedStudents = useMemo(
    () =>
      roster.filter(
        (s) => s.status === "active" && (selectedClasses ?? []).includes(s.className)
      ).length,
    [roster, selectedClasses]
  );

  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
  }, [open, record, reset]);

  const submit = handleSubmit((values) =>
    onSubmit({
      ...values,
      code: values.code.trim() || genExamCode(),
      students: derivedStudents,
    })
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit exam" : "Schedule exam"}
      description={
        isEdit
          ? "Update this exam. Changes apply immediately."
          : "Create an exam — pick from the dropdowns; the code and student count fill in automatically."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create exam"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Exam name"
            required
            list="exam-name-presets"
            placeholder="Pick or type — e.g. Mid-Term"
            {...register("name")}
            error={errors.name?.message}
          />
          <datalist id="exam-name-presets">
            {EXAM_NAME_PRESETS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <Select
            label="Exam type"
            required
            options={EXAM_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("type")}
            error={errors.type?.message}
          />
          <Select
            label="Subject"
            required
            placeholder="Select subject"
            options={subjectOptions}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Input label="Date" type="date" required {...register("date")} error={errors.date?.message} />
          <Input
            label="Start time"
            required
            list="exam-time-presets"
            placeholder="10:00 AM"
            {...register("time")}
            error={errors.time?.message}
          />
          <datalist id="exam-time-presets">
            {TIME_PRESETS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <Select
            label="Duration"
            required
            options={DURATION_OPTIONS.map((d) => ({ label: d, value: d }))}
            {...register("duration")}
            error={errors.duration?.message}
          />
          <Input
            label="Total marks"
            type="number"
            min={1}
            {...register("totalMarks")}
            error={errors.totalMarks?.message}
          />
          <Select
            label="Status"
            required
            options={EXAM_STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="Exam code"
            hint="Leave blank to auto-generate"
            placeholder="EX-1234"
            {...register("code")}
            error={errors.code?.message}
          />
        </div>

        <Controller
          control={control}
          name="classes"
          render={({ field }) => (
            <MultiSelect
              label="Classes"
              required
              options={classNames}
              value={field.value}
              onChange={field.onChange}
              error={errors.classes?.message}
            />
          )}
        />

        <p className="rounded-md bg-surface-sunken px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-text">{derivedStudents}</span> active student
          {derivedStudents === 1 ? "" : "s"} in the selected class{(selectedClasses?.length ?? 0) === 1 ? "" : "es"} will appear for this exam (auto-counted).
        </p>

        {subjectOptions.length === 0 && (
          <p className="text-xs text-warning-text">No subjects yet — add them in the Subjects section for the dropdown.</p>
        )}

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
