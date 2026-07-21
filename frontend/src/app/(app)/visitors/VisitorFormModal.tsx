"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { visitorSchema, type VisitorSchema } from "@/lib/schemas/visitor";
import {
  VISITOR_PURPOSE_OPTIONS,
  VISITOR_STATUS_OPTIONS,
  type Visitor,
} from "@/lib/api/visitors";

const emptyValues: VisitorSchema = {
  name: "",
  phone: "",
  purpose: "Parent meeting",
  whomToMeet: "",
  status: "inside",
  notes: "",
};

interface VisitorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = check-in mode. */
  record?: Visitor | null;
  saving?: boolean;
  onSubmit: (values: VisitorSchema) => Promise<void>;
}

export function VisitorFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: VisitorFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VisitorSchema>({
    resolver: zodResolver(visitorSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? {
            name: record.name,
            phone: record.phone,
            purpose: record.purpose,
            whomToMeet: record.whomToMeet,
            status: record.status,
            notes: record.pickupFor ?? "",
          }
        : emptyValues
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit visitor entry" : "Check in visitor"}
      description={
        isEdit
          ? "Update this gate log entry. The gate pass code stays the same."
          : "A QR gate pass is generated automatically once the entry is saved."
      }
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? (
              "Saving…"
            ) : isEdit ? (
              "Save changes"
            ) : (
              <>
                <UserPlus className="size-4" />
                Issue gate pass
              </>
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          required
          placeholder="e.g. Ramesh Kulkarni"
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          label="Phone number"
          required
          type="tel"
          placeholder="+91 98220 41277"
          {...register("phone")}
          error={errors.phone?.message}
        />
        <Select
          label="Purpose of visit"
          required
          options={VISITOR_PURPOSE_OPTIONS}
          {...register("purpose")}
          error={errors.purpose?.message}
        />
        <Input
          label="Whom to meet"
          required
          placeholder="e.g. Meenakshi Iyer (Class Teacher, VIII-A)"
          {...register("whomToMeet")}
          error={errors.whomToMeet?.message}
        />
        <Select
          label="Status"
          required
          options={VISITOR_STATUS_OPTIONS}
          {...register("status")}
          error={errors.status?.message}
        />
        <Textarea
          label="Notes"
          placeholder="For student pickup, enter the student name and class."
          hint="Optional — recorded against the gate pass."
          {...register("notes")}
          error={errors.notes?.message}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
