"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { certificateSchema, type CertificateSchema } from "@/lib/schemas/certificate";
import {
  CERTIFICATE_STATUS_OPTIONS,
  CERTIFICATE_TYPE_OPTIONS,
  todayIso,
  type Certificate,
} from "@/lib/api/certificates";

const emptyValues: CertificateSchema = {
  student: "",
  admissionNo: "",
  className: "",
  type: "Bonafide",
  requestedBy: "",
  requestedOn: todayIso(),
  status: "pending",
};

interface CertificateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Certificate | null;
  saving?: boolean;
  onSubmit: (values: CertificateSchema) => Promise<void>;
}

export function CertificateFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: CertificateFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CertificateSchema>({
    resolver: zodResolver(certificateSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? {
            student: record.student,
            admissionNo: record.admissionNo,
            className: record.className,
            type: record.type,
            requestedBy: record.requestedBy,
            requestedOn: record.requestedOn,
            status: record.status,
          }
        : { ...emptyValues, requestedOn: todayIso() }
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit certificate request" : "New certificate request"}
      description={
        isEdit
          ? "Update this request. Marking it issued stamps today's date and a verification code."
          : "Raise a certificate request. A QR verification code is generated once it is issued."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create request"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Student name"
            required
            placeholder="Aarav Deshpande"
            {...register("student")}
            error={errors.student?.message}
          />
          <Input
            label="Admission number"
            required
            placeholder="ADM/2019/0412"
            {...register("admissionNo")}
            error={errors.admissionNo?.message}
          />
          <Input
            label="Class & section"
            required
            placeholder="VI-B"
            {...register("className")}
            error={errors.className?.message}
          />
          <Select
            label="Certificate type"
            required
            options={CERTIFICATE_TYPE_OPTIONS}
            {...register("type")}
            error={errors.type?.message}
          />
          <Input
            label="Requested by"
            required
            placeholder="Sunita Deshpande (Mother)"
            {...register("requestedBy")}
            error={errors.requestedBy?.message}
          />
          <Input
            label="Requested on"
            type="date"
            required
            {...register("requestedOn")}
            error={errors.requestedOn?.message}
          />
          <Select
            label="Status"
            required
            options={CERTIFICATE_STATUS_OPTIONS}
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
