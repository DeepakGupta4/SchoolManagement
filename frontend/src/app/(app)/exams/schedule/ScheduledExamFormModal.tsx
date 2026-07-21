"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { scheduledExamSchema, type ScheduledExamSchema } from "@/lib/schemas/examSchedule";
import {
  SCHEDULE_CLASS_OPTIONS,
  SCHEDULE_EXAM_OPTIONS,
  SCHEDULE_INVIGILATOR_OPTIONS,
  SCHEDULE_ROOM_OPTIONS,
  SCHEDULE_STATUS_OPTIONS,
  SCHEDULE_SUBJECT_OPTIONS,
  type ScheduledExam,
} from "@/lib/api/examSchedule";

const emptyValues: ScheduledExamSchema = {
  code: "",
  exam: SCHEDULE_EXAM_OPTIONS[0],
  subject: SCHEDULE_SUBJECT_OPTIONS[0],
  class: SCHEDULE_CLASS_OPTIONS[0],
  date: "",
  time: "",
  duration: "1 hr",
  room: SCHEDULE_ROOM_OPTIONS[0],
  invigilator: SCHEDULE_INVIGILATOR_OPTIONS[0],
  totalMarks: 25,
  status: "upcoming",
};

interface ScheduledExamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: ScheduledExam | null;
  saving?: boolean;
  onSubmit: (values: ScheduledExamSchema) => Promise<void>;
}

export function ScheduledExamFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: ScheduledExamFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduledExamSchema>({
    resolver: zodResolver(scheduledExamSchema),
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
      title={isEdit ? "Edit scheduled exam" : "Add scheduled exam"}
      description={
        isEdit
          ? "Update this schedule entry. Changes apply immediately."
          : "Schedule an exam sitting. The schedule code must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add to schedule"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Schedule code"
            required
            placeholder="ES008"
            {...register("code")}
            error={errors.code?.message}
          />
          <Select
            label="Exam"
            required
            options={SCHEDULE_EXAM_OPTIONS.map((e) => ({ label: e, value: e }))}
            {...register("exam")}
            error={errors.exam?.message}
          />
          <Select
            label="Subject"
            required
            options={SCHEDULE_SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }))}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Select
            label="Class"
            required
            options={SCHEDULE_CLASS_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("class")}
            error={errors.class?.message}
          />
          <Input
            label="Date"
            required
            placeholder="Jul 28, 2025"
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Start time"
            required
            placeholder="8:30 AM"
            {...register("time")}
            error={errors.time?.message}
          />
          <Input
            label="Duration"
            required
            placeholder="3 hrs"
            {...register("duration")}
            error={errors.duration?.message}
          />
          <Select
            label="Room"
            required
            options={SCHEDULE_ROOM_OPTIONS.map((r) => ({ label: r, value: r }))}
            {...register("room")}
            error={errors.room?.message}
          />
          <Select
            label="Invigilator"
            required
            options={SCHEDULE_INVIGILATOR_OPTIONS.map((i) => ({ label: i, value: i }))}
            {...register("invigilator")}
            error={errors.invigilator?.message}
          />
          <Select
            label="Status"
            required
            options={SCHEDULE_STATUS_OPTIONS}
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
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
