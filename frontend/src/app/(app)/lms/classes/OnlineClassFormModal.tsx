"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { onlineClassSchema, type OnlineClassSchema } from "@/lib/schemas/onlineClass";
import {
  KLASS_OPTIONS,
  PLATFORM_OPTIONS,
  STATE_OPTIONS,
  SUBJECT_OPTIONS,
  TEACHER_OPTIONS,
  type OnlineClass,
} from "@/lib/api/onlineClasses";

const emptyValues: OnlineClassSchema = {
  topic: "",
  subject: SUBJECT_OPTIONS[0],
  teacher: TEACHER_OPTIONS[0],
  klass: KLASS_OPTIONS[0],
  platform: PLATFORM_OPTIONS[0],
  state: "scheduled",
  when: "",
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnlineClassSchema>({
    resolver: zodResolver(onlineClassSchema),
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
            options={SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }))}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Select
            label="Teacher"
            required
            options={TEACHER_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("teacher")}
            error={errors.teacher?.message}
          />
          <Select
            label="Class"
            required
            options={KLASS_OPTIONS.map((k) => ({ label: k, value: k }))}
            {...register("klass")}
            error={errors.klass?.message}
          />
          <Select
            label="Platform"
            required
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
            label="Schedule"
            required
            placeholder="Today · 11:30"
            {...register("when")}
            error={errors.when?.message}
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
