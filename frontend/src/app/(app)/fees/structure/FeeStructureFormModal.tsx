"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input } from "@/components/ui";
import { feeStructureSchema, type FeeStructureSchema } from "@/lib/schemas/feeStructure";
import { FEE_HEADS, type FeeStructure } from "@/lib/api/feeStructures";

// Common class groupings a fee structure is defined for — offered as a quick
// pick, but the field stays free text so any custom grouping works.
const FEE_CLASS_PRESETS = [
  "Nursery-UKG",
  "Class 1-5",
  "Class 6-8",
  "Class 9-10",
  "Class 11-12",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

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
  /** Existing structures — used to block a duplicate class. */
  existing?: FeeStructure[];
  saving?: boolean;
  onSubmit: (values: FeeStructureSchema) => Promise<void>;
}

export function FeeStructureFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: FeeStructureFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

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
    // Deferred: clearing the duplicate error synchronously in an effect trips
    // the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Case-insensitive set of classes already covered by *other* structures —
  // each class grouping should have exactly one fee structure.
  const takenClasses = useMemo(() => {
    const set = new Set<string>();
    for (const f of existing) {
      if (record && f.id === record.id) continue;
      set.add(f.class.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  const submit = handleSubmit((values) => {
    const cls = values.class.trim();
    if (takenClasses.has(cls.toLowerCase())) {
      setDupError(`A fee structure for "${cls}" already exists.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, class: cls });
  });

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
          {/* Class — pick a preset grouping or type a custom one. */}
          <Input
            label="Class"
            required
            list="fee-class-presets"
            placeholder="Pick or type — e.g. Class 1-5"
            {...register("class")}
            error={errors.class?.message ?? dupError ?? undefined}
          />
          <datalist id="fee-class-presets">
            {FEE_CLASS_PRESETS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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
