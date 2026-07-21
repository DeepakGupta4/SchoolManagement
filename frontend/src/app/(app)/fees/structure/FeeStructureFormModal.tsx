"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input } from "@/components/ui";
import { feeStructureSchema, type FeeStructureSchema } from "@/lib/schemas/feeStructure";
import { FEE_HEADS, type FeeStructure } from "@/lib/api/feeStructures";

const emptyValues: FeeStructureSchema = {
  code: "",
  class: "",
  tuition: 0,
  transport: 0,
  lab: 0,
  library: 0,
  sports: 0,
  misc: 0,
};

interface FeeStructureFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: FeeStructure | null;
  saving?: boolean;
  onSubmit: (values: FeeStructureSchema) => Promise<void>;
}

export function FeeStructureFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: FeeStructureFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeeStructureSchema>({
    resolver: zodResolver(feeStructureSchema),
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
      size="lg"
      title={isEdit ? "Edit fee structure" : "Add fee structure"}
      description={
        isEdit
          ? "Update this class's fee heads. The total is recalculated automatically."
          : "Define a class's monthly fee heads. The class must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create structure"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Structure code"
            required
            placeholder="FS007"
            {...register("code")}
            error={errors.code?.message}
          />
          <Input
            label="Class"
            required
            placeholder="Class 1-5"
            {...register("class")}
            error={errors.class?.message}
          />
          {FEE_HEADS.map((head) => (
            <Input
              key={head.key}
              label={`${head.label} (₹)`}
              type="number"
              min={0}
              {...register(head.key as keyof FeeStructureSchema)}
              error={errors[head.key as keyof FeeStructureSchema]?.message}
            />
          ))}
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
