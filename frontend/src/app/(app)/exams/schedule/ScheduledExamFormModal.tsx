"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { scheduledExamSchema, type ScheduledExamSchema } from "@/lib/schemas/examSchedule";
import {
  SCHEDULE_ROOM_OPTIONS,
  SCHEDULE_STATUS_OPTIONS,
  type ScheduledExam,
} from "@/lib/api/examSchedule";
import { examsApi } from "@/lib/api/exams";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName } from "@/types/teacher";

/** Module-scope (not render) so it isn't flagged as an impure render call. */
function genScheduleCode() {
  return `ES-${Math.floor(1000 + Math.random() * 9000)}`;
}

const emptyValues: ScheduledExamSchema = {
  code: "",
  exam: "",
  subject: "",
  class: "",
  date: "",
  time: "",
  duration: "1 hr",
  room: SCHEDULE_ROOM_OPTIONS[0],
  invigilator: "",
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
  const { classOptions } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();

  // Real exams and teachers power the "which exam" and invigilator pickers so the
  // owner chooses from what they've actually created instead of static lists.
  const [examNames, setExamNames] = useState<string[]>([]);
  const [teacherNames, setTeacherNames] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    examsApi
      .list()
      .then((exams) => {
        if (!cancelled) setExamNames(exams.map((e) => e.name));
      })
      .catch(() => {});
    listTeachers()
      .then((teachers) => {
        if (!cancelled) setTeacherNames(teachers.map(teacherName));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

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

  // Auto-generate a schedule code when the owner leaves it blank.
  const submit = handleSubmit((values) =>
    onSubmit({
      ...values,
      code: values.code.trim() || genScheduleCode(),
    })
  );

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
            placeholder="Auto (e.g. ES-1234)"
            {...register("code")}
            error={errors.code?.message}
          />
          <Select
            label="Exam"
            required
            placeholder="Select exam"
            options={examNames.map((e) => ({ label: e, value: e }))}
            {...register("exam")}
            error={errors.exam?.message}
          />
          <Select
            label="Subject"
            required
            placeholder="Select subject"
            options={subjectOptions}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Select
            label="Class"
            required
            placeholder="Select class"
            options={classOptions}
            {...register("class")}
            error={errors.class?.message}
          />
          <Input
            label="Date"
            required
            type="date"
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
            placeholder="Select invigilator"
            options={teacherNames.map((t) => ({ label: t, value: t }))}
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
