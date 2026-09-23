"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { labSchema, type LabSchema } from "@/lib/schemas/lab";
import { LAB_TYPE_OPTIONS, LAB_STATUS_OPTIONS, type Lab } from "@/lib/api/labs";

const emptyValues: LabSchema = {
  name: "",
  type: "Physics",
  block: "",
  capacity: 30,
  inCharge: "",
  assistant: "",
  equipmentTotal: 0,
  equipmentWorking: 0,
  weeklyPracticals: 0,
  nextPractical: "",
  nextPracticalClass: "",
  status: "operational",
};

interface LabFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Lab | null;
  /** Existing labs — used to block a duplicate lab name. */
  existing?: Lab[];
  saving?: boolean;
  onSubmit: (values: LabSchema) => Promise<void>;
}

export function LabFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: LabFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LabSchema>({
    resolver: zodResolver(labSchema),
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

  // Case-insensitive set of names already taken by *other* labs.
  const takenNames = useMemo(() => {
    const set = new Set<string>();
    for (const l of existing) {
      if (record && l.id === record.id) continue;
      set.add(l.name.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  // Block a duplicate lab name before it reaches the server.
  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    if (takenNames.has(name.toLowerCase())) {
      setDupError(`"${name}" already exists. Pick a different lab name.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, name });
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit lab" : "Add new lab"}
      description={
        isEdit
          ? "Update this laboratory. Changes apply immediately."
          : "Create a laboratory. The lab name must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create lab"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Lab name"
            required
            placeholder="Physics Lab I"
            {...register("name")}
            error={errors.name?.message ?? dupError ?? undefined}
          />
          <Select
            label="Lab type"
            required
            options={LAB_TYPE_OPTIONS}
            {...register("type")}
            error={errors.type?.message}
          />
          <Input
            label="Block / location"
            required
            placeholder="Science Block, Ground Floor"
            {...register("block")}
            error={errors.block?.message}
          />
          <Input
            label="Seating capacity"
            type="number"
            min={0}
            {...register("capacity")}
            error={errors.capacity?.message}
          />
          <Input
            label="Lab in-charge"
            required
            placeholder="Dr. Anjali Deshmukh"
            {...register("inCharge")}
            error={errors.inCharge?.message}
          />
          <Input
            label="Lab assistant"
            required
            placeholder="Sandeep More"
            {...register("assistant")}
            error={errors.assistant?.message}
          />
          <Input
            label="Equipment items"
            type="number"
            min={0}
            {...register("equipmentTotal")}
            error={errors.equipmentTotal?.message}
          />
          <Input
            label="Working equipment"
            type="number"
            min={0}
            {...register("equipmentWorking")}
            error={errors.equipmentWorking?.message}
          />
          <Input
            label="Practicals per week"
            type="number"
            min={0}
            {...register("weeklyPracticals")}
            error={errors.weeklyPracticals?.message}
          />
          <Input
            label="Next practical"
            type="date"
            required
            {...register("nextPractical")}
            error={errors.nextPractical?.message}
          />
          <Select
            label="Status"
            required
            options={LAB_STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="Next practical details"
            required
            placeholder="XII-A · Ohm's Law verification"
            {...register("nextPracticalClass")}
            error={errors.nextPracticalClass?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
