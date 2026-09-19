"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, useToast } from "@/components/ui";
import { staffSchema, type StaffSchema } from "@/lib/schemas/staff";
import { digitsOnly10 } from "@/lib/phone";
import { AttachmentsField } from "@/components/AttachmentsField";
import { uploadDocumentFiles } from "@/lib/api/documents";
import {
  STAFF_DEPT_OPTIONS,
  STAFF_TYPE_OPTIONS,
  STAFF_STATUS_OPTIONS,
  type StaffMember,
} from "@/lib/api/staff";

const emptyValues: StaffSchema = {
  employeeId: "",
  name: "",
  role: "",
  dept: STAFF_DEPT_OPTIONS[0],
  type: STAFF_TYPE_OPTIONS[0],
  status: "active",
  phone: "",
  email: "",
  join: "",
  salary: 0,
};

interface StaffFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: StaffMember | null;
  saving?: boolean;
  /** Returns the saved staff member (so attachments can be uploaded), or null on error. */
  onSubmit: (values: StaffSchema) => Promise<StaffMember | null | void>;
}

export function StaffFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: StaffFormModalProps) {
  const isEdit = Boolean(record);

  const { toast } = useToast();
  // Files attached in the form, uploaded once the staff record has an id.
  const [attachments, setAttachments] = useState<File[]>([]);
  const [savingDocs, setSavingDocs] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffSchema>({
    resolver: zodResolver(staffSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttachments([]);
  }, [open, record, reset]);

  const submit = handleSubmit(async (values) => {
    const saved = await onSubmit(values);
    if (!saved) return; // save failed — keep the form open (error already shown)
    if (attachments.length > 0) {
      setSavingDocs(true);
      const { uploaded, failed } = await uploadDocumentFiles("staff", saved.id, saved.name, attachments);
      setSavingDocs(false);
      if (failed) {
        toast({
          title: `${uploaded} uploaded, ${failed} failed`,
          description: "Some attachments could not be saved.",
          variant: "warning",
        });
      }
    }
    onOpenChange(false);
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit staff member" : "Add staff member"}
      description={
        isEdit
          ? "Update this staff record. Changes apply immediately."
          : "Create a staff record. The employee ID must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || savingDocs}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || savingDocs}>
            {savingDocs ? "Uploading…" : saving ? "Saving…" : isEdit ? "Save changes" : "Add staff"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Employee ID" required placeholder="ST013" {...register("employeeId")} error={errors.employeeId?.message} />
          <Input label="Full name" required placeholder="Ms. Anita Gupta" {...register("name")} error={errors.name?.message} />
          <Input label="Role" required placeholder="Receptionist" {...register("role")} error={errors.role?.message} />
          <Select label="Department" required options={STAFF_DEPT_OPTIONS.map((d) => ({ label: d, value: d }))} {...register("dept")} error={errors.dept?.message} />
          <Select label="Employment type" required options={STAFF_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))} {...register("type")} error={errors.type?.message} />
          <Select label="Status" required options={STAFF_STATUS_OPTIONS} {...register("status")} error={errors.status?.message} />
          <Input label="Phone" required inputMode="numeric" maxLength={10} placeholder="9876543210" {...register("phone", { onChange: digitsOnly10 })} error={errors.phone?.message} />
          <Input label="Email" required type="email" placeholder="name@school.edu" {...register("email")} error={errors.email?.message} />
          <Input label="Join date" required placeholder="Jan 2024" {...register("join")} error={errors.join?.message} />
          <Input label="Monthly salary (₹)" type="number" min={0} {...register("salary")} error={errors.salary?.message} />
        </div>

        <div>
          <p className="mb-3 mt-1 text-xs font-semibold uppercase tracking-wide text-subtle">Documents</p>
          <AttachmentsField
            files={attachments}
            onChange={setAttachments}
            hint="Optional — ID proofs, contracts, certificates. You can also add these later from the profile."
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
