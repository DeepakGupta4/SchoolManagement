"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { jobPostingSchema, type JobPostingSchema } from "@/lib/schemas/jobPosting";
import {
  JOB_DEPT_OPTIONS,
  JOB_TYPE_OPTIONS,
  JOB_STATUS_OPTIONS,
  type JobPosting,
} from "@/lib/api/jobPostings";

const emptyValues: JobPostingSchema = {
  code: "",
  title: "",
  dept: JOB_DEPT_OPTIONS[0],
  type: JOB_TYPE_OPTIONS[0],
  posted: "",
  deadline: "",
  applicants: 0,
  status: "Open",
};

interface JobPostingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: JobPosting | null;
  saving?: boolean;
  onSubmit: (values: JobPostingSchema) => Promise<void>;
}

export function JobPostingFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: JobPostingFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobPostingSchema>({
    resolver: zodResolver(jobPostingSchema),
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
      title={isEdit ? "Edit job posting" : "Post a job"}
      description={
        isEdit
          ? "Update this posting. Changes apply immediately."
          : "Create a job posting. The job code must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Post job"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Job code" required placeholder="JB007" {...register("code")} error={errors.code?.message} />
          <Input label="Job title" required placeholder="Chemistry Teacher" {...register("title")} error={errors.title?.message} />
          <Select label="Department" required options={JOB_DEPT_OPTIONS.map((d) => ({ label: d, value: d }))} {...register("dept")} error={errors.dept?.message} />
          <Select label="Employment type" required options={JOB_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))} {...register("type")} error={errors.type?.message} />
          <Input label="Posted on" required placeholder="01 Jul 2025" {...register("posted")} error={errors.posted?.message} />
          <Input label="Deadline" required placeholder="31 Jul 2025" {...register("deadline")} error={errors.deadline?.message} />
          <Input label="Applicants" type="number" min={0} {...register("applicants")} error={errors.applicants?.message} />
          <Select label="Status" required options={JOB_STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} {...register("status")} error={errors.status?.message} />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
