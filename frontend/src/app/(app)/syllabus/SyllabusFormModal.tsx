"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName } from "@/types/teacher";
import { syllabusSchema, deriveStatus, type SyllabusSchema } from "@/lib/schemas/syllabus";
import type { SyllabusChapter } from "@/lib/api/syllabus";

/** "Unit 1".."Unit 10" for the datalist — pick a common one or type your own. */
const UNIT_OPTIONS = Array.from({ length: 10 }, (_, i) => `Unit ${i + 1}`);

const emptyValues: SyllabusSchema = {
  className: "",
  subject: "",
  teacher: "",
  unit: "",
  chapter: "",
  topics: 0,
  completedTopics: 0,
  date: "",
};

interface SyllabusFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: SyllabusChapter | null;
  /** Pre-selects this class in create mode so the row lands on the class in view. */
  defaultClass?: string;
  saving?: boolean;
  onSubmit: (values: Omit<SyllabusChapter, "id">) => Promise<void>;
}

export function SyllabusFormModal({
  open,
  onOpenChange,
  record,
  defaultClass,
  saving,
  onSubmit,
}: SyllabusFormModalProps) {
  const isEdit = Boolean(record);
  const { classOptions } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();
  const [teacherNames, setTeacherNames] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SyllabusSchema>({
    resolver: zodResolver(syllabusSchema),
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
    reset(
      record
        ? {
            className: record.className,
            subject: record.subject,
            teacher: record.teacher,
            unit: record.unit,
            chapter: record.chapter,
            topics: record.topics,
            completedTopics: record.completedTopics,
            date: record.date && record.date !== "—" ? record.date : "",
          }
        : { ...emptyValues, className: defaultClass ?? "" }
    );
  }, [open, record, defaultClass, reset]);

  // Status is derived, not chosen; date falls back to the server's "—" sentinel.
  const submit = handleSubmit((values) =>
    onSubmit({
      ...values,
      status: deriveStatus(values.topics, values.completedTopics),
      date: values.date || "—",
    })
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit chapter" : "Add chapter"}
      description={
        isEdit
          ? "Update this chapter. Progress and status update automatically."
          : "Add a chapter to the syllabus. Status is set from the topics you mark done."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add chapter"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Class"
            required
            placeholder="Select class"
            options={classOptions}
            {...register("className")}
            error={errors.className?.message}
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
            placeholder="Select teacher"
            options={teacherNames.map((t) => ({ label: t, value: t }))}
            {...register("teacher")}
            error={errors.teacher?.message}
          />
          <Input
            label="Unit"
            required
            list="syllabus-units"
            placeholder="Pick or type — e.g. Unit 1"
            {...register("unit")}
            error={errors.unit?.message}
          />
          <datalist id="syllabus-units">
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <Input
            label="Chapter"
            required
            placeholder="e.g. Real Numbers"
            {...register("chapter")}
            error={errors.chapter?.message}
          />
          <Input
            label="Total topics"
            type="number"
            min={0}
            {...register("topics")}
            error={errors.topics?.message}
          />
          <Input
            label="Topics completed"
            type="number"
            min={0}
            {...register("completedTopics")}
            error={errors.completedTopics?.message}
          />
          <Input
            label="Taught on"
            type="date"
            hint="Optional"
            {...register("date")}
            error={errors.date?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
