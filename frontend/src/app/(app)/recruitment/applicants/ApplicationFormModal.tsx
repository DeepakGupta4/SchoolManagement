"use client";

import { useEffect, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { applicationSchema, type ApplicationSchema } from "@/lib/schemas/application";
import { APPLICATION_STAGES, STAGE_LABEL, type Application } from "@/lib/api/applications";
import { type JobPosting } from "@/lib/api/jobPostings";
import { TODAY_ISO } from "@/lib/dates";

const emptyValues: ApplicationSchema = {
  jobCode: "",
  jobTitle: "",
  name: "",
  email: "",
  phone: "",
  experience: "",
  appliedOn: TODAY_ISO,
  stage: "applied",
  note: "",
};

interface ApplicationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Application | null;
  /** Open job postings — the candidate is linked to one by its code. */
  postings: JobPosting[];
  saving?: boolean;
  onSubmit: (values: ApplicationSchema) => Promise<void>;
}

export function ApplicationFormModal({
  open,
  onOpenChange,
  record,
  postings,
  saving,
  onSubmit,
}: ApplicationFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ApplicationSchema>({
    resolver: zodResolver(applicationSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
  }, [open, record, reset]);

  // Picking a posting fills in its title so the applied-for role is recorded.
  const onPostingChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const p = postings.find((x) => x.code === e.target.value);
    setValue("jobTitle", p?.title ?? "", { shouldValidate: true });
  };

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit applicant" : "Add applicant"}
      description={
        isEdit ? "Update this candidate's details and pipeline stage." : "Add a candidate to the hiring pipeline."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add applicant"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Candidate name" required placeholder="Anita Gupta" {...register("name")} error={errors.name?.message} />
          <Select
            label="Applied for"
            placeholder="No specific posting"
            options={postings.map((p) => ({ label: `${p.title} · ${p.code}`, value: p.code }))}
            {...register("jobCode", { onChange: onPostingChange })}
            error={errors.jobCode?.message}
          />
          <Input label="Email" type="email" placeholder="name@example.com" {...register("email")} error={errors.email?.message} />
          <Input label="Phone" placeholder="9876543210" {...register("phone")} error={errors.phone?.message} />
          <Input label="Experience" placeholder="e.g. 5 years" {...register("experience")} error={errors.experience?.message} />
          <Input label="Applied on" type="date" max={TODAY_ISO} {...register("appliedOn")} error={errors.appliedOn?.message} />
          <Select
            label="Stage"
            required
            options={APPLICATION_STAGES.map((s) => ({ label: STAGE_LABEL[s], value: s }))}
            {...register("stage")}
            error={errors.stage?.message}
          />
        </div>

        <Textarea label="Notes" placeholder="Interview notes, availability…" {...register("note")} error={errors.note?.message} />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
