"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { transferSchema, type TransferSchema } from "@/lib/schemas/transfer";
import {
  CLASS_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  type TransferRequest,
} from "@/lib/api/transfers";

const emptyValues: TransferSchema = {
  name: "",
  studentId: "",
  className: CLASS_OPTIONS[0],
  type: TYPE_OPTIONS[0].value,
  reason: "",
  requestedOn: new Date().toISOString().slice(0, 10),
  issuedOn: "—",
  tcNo: "—",
  status: "pending",
  dues: 0,
};

interface TransferFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: TransferRequest | null;
  saving?: boolean;
  onSubmit: (values: TransferSchema) => Promise<void>;
}

export function TransferFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: TransferFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferSchema>({
    resolver: zodResolver(transferSchema),
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
      title={isEdit ? "Edit request" : "New transfer request"}
      description={
        isEdit
          ? "Update this request. Changes apply immediately."
          : "Raise a transfer or withdrawal request. The student ID must be unique."
      }
      size="lg"
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
            placeholder="Aarav Sharma"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            label="Student ID"
            required
            placeholder="STU-0917"
            {...register("studentId")}
            error={errors.studentId?.message}
          />
          <Select
            label="Class"
            required
            options={CLASS_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("className")}
            error={errors.className?.message}
          />
          <Select
            label="Request type"
            required
            options={TYPE_OPTIONS}
            {...register("type")}
            error={errors.type?.message}
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
            options={STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="TC number"
            required
            hint="Use — until a certificate is issued."
            {...register("tcNo")}
            error={errors.tcNo?.message}
          />
          <Input
            label="Issued on"
            required
            hint="Use — until a certificate is issued."
            {...register("issuedOn")}
            error={errors.issuedOn?.message}
          />
          <Input
            label="Pending dues (₹)"
            type="number"
            min={0}
            {...register("dues")}
            error={errors.dues?.message}
          />
        </div>

        <Textarea
          label="Reason"
          required
          placeholder="Why is the student leaving?"
          {...register("reason")}
          error={errors.reason?.message}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
