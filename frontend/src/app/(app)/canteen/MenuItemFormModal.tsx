"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { menuItemSchema, type MenuItemSchema } from "@/lib/schemas/menuItem";
import {
  CATEGORY_OPTIONS,
  AVAILABILITY_OPTIONS,
  type MenuItem,
} from "@/lib/api/menuItems";

const emptyValues: MenuItemSchema = {
  name: "",
  category: CATEGORY_OPTIONS[0],
  emoji: "🍽️",
  price: 0,
  sold: 0,
  available: "true",
};

interface MenuItemFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: MenuItem | null;
  saving?: boolean;
  onSubmit: (values: MenuItemSchema) => Promise<void>;
}

export function MenuItemFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: MenuItemFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MenuItemSchema>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? {
            name: record.name,
            category: record.category,
            emoji: record.emoji,
            price: record.price,
            sold: record.sold,
            available: String(record.available),
          }
        : emptyValues
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit menu item" : "Add menu item"}
      description={
        isEdit
          ? "Update this menu item. Changes apply immediately."
          : "Add an item to the canteen menu. The item name must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add item"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Item name"
            required
            placeholder="Veg Thali"
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
            label="Emoji"
            required
            placeholder="🍱"
            {...register("emoji")}
            error={errors.emoji?.message}
          />
          <Input
            label="Price (₹)"
            type="number"
            min={0}
            {...register("price")}
            error={errors.price?.message}
          />
          <Input
            label="Sold today"
            type="number"
            min={0}
            {...register("sold")}
            error={errors.sold?.message}
          />
          <Select
            label="Availability"
            required
            options={AVAILABILITY_OPTIONS}
            {...register("available")}
            error={errors.available?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
