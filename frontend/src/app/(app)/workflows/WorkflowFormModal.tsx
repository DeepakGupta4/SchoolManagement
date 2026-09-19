"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { workflowSchema, type WorkflowSchema } from "@/lib/schemas/workflow";
import { TRIGGER_OPTIONS, type Workflow } from "@/lib/api/workflows";

const emptyValues: WorkflowSchema = {
  name: "",
  description: "",
  trigger: "attendance_low",
  threshold: 75,
  enabled: true,
};

interface WorkflowFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Workflow | null;
  saving?: boolean;
  onSubmit: (values: WorkflowSchema) => Promise<void>;
}

export function WorkflowFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: WorkflowFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkflowSchema>({
    resolver: zodResolver(workflowSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? {
            name: record.name,
            description: record.description,
            trigger: record.trigger,
            threshold: record.threshold,
            enabled: record.enabled,
          }
        : emptyValues
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit automation rule" : "New automation rule"}
      description={
        isEdit
          ? "Update this rule. Changes apply the next time it runs."
          : "Pick a trigger — the rule posts an alert whenever its condition matches."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create rule"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Rule name"
          required
          placeholder="Low attendance alert"
          {...register("name")}
          error={errors.name?.message}
        />

        <Textarea
          label="Description"
          rows={2}
          placeholder="What this automation does and why…"
          {...register("description")}
          error={errors.description?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Trigger"
            required
            options={TRIGGER_OPTIONS}
            {...register("trigger")}
            error={errors.trigger?.message}
          />
          <Input
            label="Attendance threshold"
            type="number"
            min={1}
            max={100}
            hint="Used by the Low attendance trigger — students below this % are flagged."
            {...register("threshold")}
            error={errors.threshold?.message}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            {...register("enabled")}
            className="focus-ring size-4 cursor-pointer rounded-sm accent-primary"
          />
          <span className="text-sm text-text">Enabled — run this rule automatically</span>
        </label>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
