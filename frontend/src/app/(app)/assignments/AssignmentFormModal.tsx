"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { assignmentSchema, type AssignmentSchema } from "@/lib/schemas/assignment";
import {
  ASSIGNMENT_STATUS_OPTIONS,
  ASSIGNMENT_SUBJECT_OPTIONS,
  ASSIGNMENT_TYPE_OPTIONS,
  type Assignment,
} from "@/lib/api/assignments";

const emptyValues: AssignmentSchema = {
  title: "",
  subject: ASSIGNMENT_SUBJECT_OPTIONS[0],
  class: "",
  teacher: "",
  given: "",
  due: "",
  totalMarks: 10,
  submitted: 0,
  total: 40,
  status: "upcoming",
  type: ASSIGNMENT_TYPE_OPTIONS[0],
};

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface AssignmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Assignment | null;
  saving?: boolean;
  onSubmit: (values: AssignmentSchema) => Promise<void>;
}

export function AssignmentFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: AssignmentFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
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
      title={isEdit ? "Edit assignment" : "New assignment"}
      description={
        isEdit
          ? "Update this assignment. Changes apply immediately."
          : "Set a new assignment. The title must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create assignment"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          placeholder="Quadratic Equations Practice"
          {...register("title")}
          error={errors.title?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Subject"
            required
            options={ASSIGNMENT_SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }))}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Input
            label="Class"
            required
            placeholder="10-A"
            {...register("class")}
            error={errors.class?.message}
          />
          <Input
            label="Teacher"
            required
            placeholder="Dr. Priya Sharma"
            {...register("teacher")}
            error={errors.teacher?.message}
          />
          <Select
            label="Type"
            required
            options={ASSIGNMENT_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("type")}
            error={errors.type?.message}
          />
          <Input
            label="Given on"
            required
            placeholder="Jul 10"
            {...register("given")}
            error={errors.given?.message}
          />
          <Input
            label="Due date"
            required
            placeholder="Jul 17"
            {...register("due")}
            error={errors.due?.message}
          />
          <Input
            label="Total marks"
            type="number"
            min={1}
            {...register("totalMarks")}
            error={errors.totalMarks?.message}
          />
          <Input
            label="Students"
            type="number"
            min={1}
            {...register("total")}
            error={errors.total?.message}
          />
          <Input
            label="Submitted"
            type="number"
            min={0}
            {...register("submitted")}
            error={errors.submitted?.message}
          />
          <Select
            label="Status"
            required
            options={ASSIGNMENT_STATUS_OPTIONS.map((s) => ({
              label: statusLabel(s),
              value: s,
            }))}
            {...register("status")}
            error={errors.status?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
