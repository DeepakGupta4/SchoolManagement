"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, MultiSelect } from "@/components/ui";
import { examSchema, type ExamSchema } from "@/lib/schemas/exam";
import {
  EXAM_CLASS_OPTIONS,
  EXAM_STATUS_OPTIONS,
  EXAM_SUBJECT_OPTIONS,
  EXAM_TYPE_OPTIONS,
  type Exam,
} from "@/lib/api/exams";

const emptyValues: ExamSchema = {
  code: "",
  name: "",
  type: EXAM_TYPE_OPTIONS[0],
  classes: ["10-A"],
  subject: EXAM_SUBJECT_OPTIONS[0],
  date: "",
  time: "",
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

export function ExamFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: ExamFormModalProps) {
  const isEdit = Boolean(record);

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

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit exam" : "Schedule exam"}
      description={
        isEdit
          ? "Update this exam. Changes apply immediately."
          : "Create an exam. The exam code must be unique."
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
            label="Exam code"
            required
            placeholder="EX009"
            {...register("code")}
            error={errors.code?.message}
          />
          <Input
            label="Exam name"
            required
            placeholder="Unit Test 3"
            {...register("name")}
            error={errors.name?.message}
          />
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
            options={EXAM_SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }))}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Input
            label="Date"
            required
            placeholder="Jul 20, 2025"
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Start time"
            required
            placeholder="9:00 AM"
            {...register("time")}
            error={errors.time?.message}
          />
          <Input
            label="Duration"
            required
            placeholder="1 hr"
            {...register("duration")}
            error={errors.duration?.message}
          />
          <Select
            label="Status"
            required
            options={EXAM_STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="Total marks"
            type="number"
            min={0}
            {...register("totalMarks")}
            error={errors.totalMarks?.message}
          />
          <Input
            label="Students"
            type="number"
            min={0}
            {...register("students")}
            error={errors.students?.message}
          />
        </div>

        <Controller
          control={control}
          name="classes"
          render={({ field }) => (
            <MultiSelect
              label="Classes"
              required
              options={EXAM_CLASS_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.classes?.message}
            />
          )}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
