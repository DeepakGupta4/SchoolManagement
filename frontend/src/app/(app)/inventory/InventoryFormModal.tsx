"use client";

import { useEffect } from "react";
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
  saving?: boolean;
  onSubmit: (values: InventoryItemSchema) => Promise<void>;
}

export function InventoryFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: InventoryFormModalProps) {
  const isEdit = Boolean(record);

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
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

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
            error={errors.name?.message}
          />
          <Select
            label="Category"
            required
            options={CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("category")}
            error={errors.category?.message}
          />
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
          <Select
            label="Unit"
            required
            options={UNIT_OPTIONS.map((u) => ({ label: u, value: u }))}
            {...register("unit")}
            error={errors.unit?.message}
          />
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
