"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { medicineSchema, type MedicineSchema } from "@/lib/schemas/medicine";
import {
  MEDICINE_CATEGORY_OPTIONS,
  MEDICINE_STOCK_STATUS_OPTIONS,
  MEDICINE_UNIT_OPTIONS,
  type Medicine,
} from "@/lib/api/medicines";

const emptyValues: MedicineSchema = {
  name: "",
  category: MEDICINE_CATEGORY_OPTIONS[0],
  stock: 0,
  unit: MEDICINE_UNIT_OPTIONS[0],
  expiry: "",
  status: MEDICINE_STOCK_STATUS_OPTIONS[0],
};

interface MedicineFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Medicine | null;
  /** Existing medicines — used to block a duplicate medicine name. */
  existing?: Medicine[];
  saving?: boolean;
  onSubmit: (values: MedicineSchema) => Promise<void>;
}

export function MedicineFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: MedicineFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicineSchema>({
    resolver: zodResolver(medicineSchema),
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

  // Case-insensitive set of names already taken by *other* medicines.
  const takenNames = useMemo(() => {
    const set = new Set<string>();
    for (const m of existing) {
      if (record && m.id === record.id) continue;
      set.add(m.name.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  // Block a duplicate medicine name before it reaches the server.
  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    if (takenNames.has(name.toLowerCase())) {
      setDupError(`"${name}" already exists in the stock. Pick a different name.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, name });
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit medicine" : "Add new medicine"}
      description={
        isEdit
          ? "Update this medicine. Changes apply immediately."
          : "Add an item to the infirmary stock. The medicine name must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add medicine"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Medicine name"
            required
            placeholder="Paracetamol 500mg"
            {...register("name")}
            error={errors.name?.message ?? dupError ?? undefined}
          />

          {/* Category — pick a preset or type a custom one. */}
          <Input
            label="Category"
            required
            list="medicine-categories"
            placeholder="Pick or type — e.g. Analgesic"
            {...register("category")}
            error={errors.category?.message}
          />
          <datalist id="medicine-categories">
            {MEDICINE_CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <Input
            label="Stock"
            type="number"
            min={0}
            {...register("stock")}
            error={errors.stock?.message}
          />

          {/* Unit — pick a preset or type a custom one. */}
          <Input
            label="Unit"
            required
            list="medicine-units"
            placeholder="Pick or type — e.g. Tablets"
            {...register("unit")}
            error={errors.unit?.message}
          />
          <datalist id="medicine-units">
            {MEDICINE_UNIT_OPTIONS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          <Input
            label="Expiry"
            required
            placeholder="Dec 2026"
            {...register("expiry")}
            error={errors.expiry?.message}
          />
          <Select
            label="Stock status"
            required
            options={MEDICINE_STOCK_STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
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
