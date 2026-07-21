"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { patientSchema, type PatientSchema } from "@/lib/schemas/patient";
import {
  PATIENT_DOCTOR_OPTIONS,
  PATIENT_STATUS_OPTIONS,
  PATIENT_TYPE_OPTIONS,
  type Patient,
} from "@/lib/api/patients";

const emptyValues: PatientSchema = {
  name: "",
  class: "",
  issue: "",
  doctor: PATIENT_DOCTOR_OPTIONS[0],
  date: "",
  type: PATIENT_TYPE_OPTIONS[0],
  status: PATIENT_STATUS_OPTIONS[1],
};

interface PatientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Patient | null;
  saving?: boolean;
  onSubmit: (values: PatientSchema) => Promise<void>;
}

export function PatientFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: PatientFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientSchema>({
    resolver: zodResolver(patientSchema),
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
      title={isEdit ? "Edit health record" : "Add health record"}
      description={
        isEdit
          ? "Update this infirmary visit. Changes apply immediately."
          : "Log a new infirmary visit for a student or staff member."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add record"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Patient name"
            required
            placeholder="Aarav Sharma"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            label="Class"
            required
            placeholder="10-A (use — for staff)"
            {...register("class")}
            error={errors.class?.message}
          />
          <Input
            label="Issue"
            required
            placeholder="Fever"
            {...register("issue")}
            error={errors.issue?.message}
          />
          <Select
            label="Doctor"
            required
            options={PATIENT_DOCTOR_OPTIONS.map((d) => ({ label: d, value: d }))}
            {...register("doctor")}
            error={errors.doctor?.message}
          />
          <Input
            label="Visit date"
            required
            placeholder="15 Jul 2025"
            {...register("date")}
            error={errors.date?.message}
          />
          <Select
            label="Type"
            required
            options={PATIENT_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("type")}
            error={errors.type?.message}
          />
          <Select
            label="Status"
            required
            options={PATIENT_STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
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
