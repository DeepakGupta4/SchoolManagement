"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { hostelStudentSchema, type HostelStudentSchema } from "@/lib/schemas/hostelStudent";
import {
  HOSTEL_OPTIONS,
  HOSTEL_TYPE_OPTIONS,
  FEE_STATUS_OPTIONS,
  type HostelStudent,
} from "@/lib/api/hostelStudents";

const emptyValues: HostelStudentSchema = {
  studentId: "",
  name: "",
  class: "",
  hostel: HOSTEL_OPTIONS[0],
  room: "",
  type: HOSTEL_TYPE_OPTIONS[0],
  fees: FEE_STATUS_OPTIONS[1],
  joinDate: "Apr 2025",
  contact: "",
};

interface HostelStudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: HostelStudent | null;
  saving?: boolean;
  onSubmit: (values: HostelStudentSchema) => Promise<void>;
}

export function HostelStudentFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: HostelStudentFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HostelStudentSchema>({
    resolver: zodResolver(hostelStudentSchema),
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
      title={isEdit ? "Edit resident" : "Add hostel resident"}
      size="lg"
      description={
        isEdit
          ? "Update this resident's allocation. Changes apply immediately."
          : "Allocate a student to a hostel room. The room no. must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add resident"}
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
            placeholder="S011"
            {...register("studentId")}
            error={errors.studentId?.message}
          />
          <Input
            label="Class"
            required
            placeholder="10-A"
            {...register("class")}
            error={errors.class?.message}
          />
          <Select
            label="Hostel"
            required
            options={HOSTEL_OPTIONS.map((h) => ({ label: h, value: h }))}
            {...register("hostel")}
            error={errors.hostel?.message}
          />
          <Input
            label="Room no."
            required
            placeholder="A-103"
            {...register("room")}
            error={errors.room?.message}
          />
          <Select
            label="Type"
            required
            options={HOSTEL_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("type")}
            error={errors.type?.message}
          />
          <Select
            label="Fee status"
            required
            options={FEE_STATUS_OPTIONS.map((f) => ({ label: f, value: f }))}
            {...register("fees")}
            error={errors.fees?.message}
          />
          <Input
            label="Join date"
            required
            placeholder="Apr 2025"
            {...register("joinDate")}
            error={errors.joinDate?.message}
          />
          <Input
            label="Contact"
            required
            placeholder="98765-XXXXX"
            {...register("contact")}
            error={errors.contact?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
