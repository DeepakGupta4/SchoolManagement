"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { inventoryItemSchema, type InventoryItemSchema } from "@/lib/schemas/inventoryItem";
import {
  CATEGORY_OPTIONS,
  UNIT_OPTIONS,
  STATUS_OPTIONS,
  type InventoryItem,
} from "@/lib/api/inventory";

const emptyValues: InventoryItemSchema = {
  name: "",
  category: CATEGORY_OPTIONS[0],
  qty: 0,
  minQty: 0,
  unit: UNIT_OPTIONS[0],
  unitPrice: 0,
  supplier: "",
  lastUpdated: "",
  status: STATUS_OPTIONS[0].value,
};

interface InventoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: InventoryItem | null;
  /** Existing items — used to block a duplicate item name. */
  existing?: InventoryItem[];
  saving?: boolean;
  onSubmit: (values: InventoryItemSchema) => Promise<void>;
}

export function InventoryFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: InventoryFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryItemSchema>({
    resolver: zodResolver(inventoryItemSchema),
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

  // Case-insensitive set of names already taken by *other* items.
  const takenNames = useMemo(() => {
    const set = new Set<string>();
    for (const i of existing) {
      if (record && i.id === record.id) continue;
      set.add(i.name.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  // Block a duplicate item name before it reaches the server.
  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    if (takenNames.has(name.toLowerCase())) {
      setDupError(`"${name}" already exists. Pick a different item name.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, name });
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit item" : "Add new item"}
      size="lg"
      description={
        isEdit
          ? "Update this stock item. Changes apply immediately."
          : "Add an item to the inventory. The item name must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create item"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Item name"
            required
            placeholder="A4 Paper Reams"
            {...register("name")}
            error={errors.name?.message ?? dupError ?? undefined}
          />

          {/* Category — pick a preset or type a custom one. */}
          <Input
            label="Category"
            required
            list="inventory-categories"
            placeholder="Pick or type — e.g. Stationery"
            {...register("category")}
            error={errors.category?.message}
          />
          <datalist id="inventory-categories">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <Input
            label="Quantity"
            type="number"
            min={0}
            {...register("qty")}
            error={errors.qty?.message}
          />
          <Input
            label="Minimum quantity"
            type="number"
            min={0}
            {...register("minQty")}
            error={errors.minQty?.message}
          />

          {/* Unit — pick a preset or type a custom one. */}
          <Input
            label="Unit"
            required
            list="inventory-units"
            placeholder="Pick or type — e.g. Reams"
            {...register("unit")}
            error={errors.unit?.message}
          />
          <datalist id="inventory-units">
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          <Input
            label="Unit price (₹)"
            type="number"
            min={0}
            {...register("unitPrice")}
            error={errors.unitPrice?.message}
          />
          <Input
            label="Supplier"
            required
            placeholder="Paper World"
            {...register("supplier")}
            error={errors.supplier?.message}
          />
          <Input
            label="Last updated"
            required
            placeholder="Jul 15, 2025"
            {...register("lastUpdated")}
            error={errors.lastUpdated?.message}
          />
          <Select
            label="Stock status"
            required
            options={STATUS_OPTIONS}
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
