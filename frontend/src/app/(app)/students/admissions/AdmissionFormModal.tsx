"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { admissionSchema, type AdmissionSchema } from "@/lib/schemas/admission";
import {
  CLASS_APPLIED_OPTIONS,
  SOURCE_OPTIONS,
  STAGE_OPTIONS,
  type Application,
} from "@/lib/api/admissions";

const emptyValues: AdmissionSchema = {
  applicationNo: "",
  name: "",
  classApplied: CLASS_APPLIED_OPTIONS[0],
  parent: "",
  phone: "",
  source: SOURCE_OPTIONS[0],
  appliedOn: new Date().toISOString().slice(0, 10),
  stage: "enquiry",
  score: 0,
  notes: "",
};

interface AdmissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Application | null;
  saving?: boolean;
  onSubmit: (values: AdmissionSchema) => Promise<void>;
}

export function AdmissionFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: AdmissionFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdmissionSchema>({
    resolver: zodResolver(admissionSchema),
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
      title={isEdit ? "Edit application" : "New application"}
      description={
        isEdit
          ? "Update this application. Changes apply immediately."
          : "Register an applicant. The application number must be unique."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create application"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Application number"
            required
            placeholder="ADM-2026-019"
            {...register("applicationNo")}
            error={errors.applicationNo?.message}
          />
          <Input
            label="Applicant name"
            required
            placeholder="Aarav Sharma"
            {...register("name")}
            error={errors.name?.message}
          />
          <Select
            label="Class applied"
            required
            options={CLASS_APPLIED_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("classApplied")}
            error={errors.classApplied?.message}
          />
          <Input
            label="Parent / guardian"
            required
            placeholder="Rohit Sharma"
            {...register("parent")}
            error={errors.parent?.message}
          />
          <Input
            label="Phone"
            required
            placeholder="98765-43210"
            {...register("phone")}
            error={errors.phone?.message}
          />
          <Select
            label="Source"
            required
            options={SOURCE_OPTIONS.map((s) => ({ label: s, value: s }))}
            {...register("source")}
            error={errors.source?.message}
          />
          <Input
            label="Applied on"
            type="date"
            required
            {...register("appliedOn")}
            error={errors.appliedOn?.message}
          />
          <Select
            label="Stage"
            required
            options={STAGE_OPTIONS}
            {...register("stage")}
            error={errors.stage?.message}
          />
          <Input
            label="Entrance score"
            type="number"
            min={0}
            max={100}
            hint="Leave at 0 until the test is taken."
            {...register("score")}
            error={errors.score?.message}
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Anything the admissions team should know…"
          {...register("notes")}
          error={errors.notes?.message}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
