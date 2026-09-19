"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName } from "@/types/teacher";
import {
  onlineClassFormSchema,
  joinWhen,
  splitWhen,
  type OnlineClassFormSchema,
  type OnlineClassSchema,
} from "@/lib/schemas/onlineClass";
import { PLATFORM_OPTIONS, STATE_OPTIONS, type OnlineClass } from "@/lib/api/onlineClasses";

const emptyValues: OnlineClassFormSchema = {
  topic: "",
  subject: "",
  teacher: "",
  klass: "",
  platform: "",
  state: "scheduled",
  date: "",
  time: "",
  duration: 45,
  attendees: 0,
  link: "",
  agenda: "",
};

interface OnlineClassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: OnlineClass | null;
  saving?: boolean;
  onSubmit: (values: OnlineClassSchema) => Promise<void>;
}

export function OnlineClassFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: OnlineClassFormModalProps) {
  const isEdit = Boolean(record);
  const { classOptions } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();
  const [teacherNames, setTeacherNames] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnlineClassFormSchema>({
    resolver: zodResolver(onlineClassFormSchema),
    defaultValues: emptyValues,
  });

  // Real teachers power the teacher picker so the owner chooses from staff they
  // actually created rather than a static list.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listTeachers()
      .then((teachers) => {
        if (!cancelled) setTeacherNames(teachers.map(teacherName));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    if (record) {
      const { date, time } = splitWhen(record.when);
      reset({
        topic: record.topic,
        subject: record.subject,
        teacher: record.teacher,
        klass: record.klass,
        platform: record.platform,
        state: record.state,
        date,
        time,
        duration: record.duration,
        attendees: record.attendees,
        link: record.link,
        agenda: record.agenda,
      });
    } else {
      reset(emptyValues);
    }
  }, [open, record, reset]);

  // Collapse the date + time controls back into the stored `when` string.
  const submit = handleSubmit(({ date, time, ...rest }) =>
    onSubmit({ ...rest, when: joinWhen(date, time) })
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit class" : "Schedule class"}
      description={
        isEdit
          ? "Update this session. Changes apply immediately."
          : "Schedule a live session or archive a recorded lecture."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Schedule class"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Topic"
            required
            placeholder="Quadratic Equations — Drill"
            {...register("topic")}
            error={errors.topic?.message}
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
            label="Teacher"
            required
            placeholder="Select teacher"
            options={teacherNames.map((t) => ({ label: t, value: t }))}
            {...register("teacher")}
            error={errors.teacher?.message}
          />
          <Select
            label="Class"
            required
            placeholder="Select class"
            options={classOptions}
            {...register("klass")}
            error={errors.klass?.message}
          />
          <Select
            label="Platform"
            required
            placeholder="Select platform"
            options={PLATFORM_OPTIONS.map((p) => ({ label: p, value: p }))}
            {...register("platform")}
            error={errors.platform?.message}
          />
          <Select
            label="Status"
            required
            options={STATE_OPTIONS}
            {...register("state")}
            error={errors.state?.message}
          />
          <Input
            label="Date"
            type="date"
            required
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Time"
            type="time"
            required
            {...register("time")}
            error={errors.time?.message}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            min={5}
            max={240}
            required
            {...register("duration")}
            error={errors.duration?.message}
          />
          <Input
            label="Attendees"
            type="number"
            min={0}
            hint="Expected or actual head count."
            {...register("attendees")}
            error={errors.attendees?.message}
          />
          <Input
            label="Joining link"
            required
            placeholder="meet.google.com/xkq-mnvz-abc"
            {...register("link")}
            error={errors.link?.message}
          />
        </div>

        <Textarea
          label="Agenda"
          placeholder="What will this session cover?"
          {...register("agenda")}
          error={errors.agenda?.message}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
