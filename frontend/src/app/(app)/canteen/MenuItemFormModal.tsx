"use client";

import { useEffect, useMemo, useState } from "react";
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
  /** Existing menu items — used to block a duplicate item name. */
  existing?: MenuItem[];
  saving?: boolean;
  onSubmit: (values: MenuItemSchema) => Promise<void>;
}

export function MenuItemFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: MenuItemFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

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
    // Deferred: clearing the duplicate error synchronously in an effect trips
    // the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Case-insensitive set of names already taken by *other* menu items.
  const takenNames = useMemo(() => {
    const set = new Set<string>();
    for (const m of existing) {
      if (record && m.id === record.id) continue;
      set.add(m.name.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  // Block a duplicate item name before it reaches the server.
  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    if (takenNames.has(name.toLowerCase())) {
      setDupError(`"${name}" is already on the menu. Pick a different name.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, name });
  });

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
            error={errors.name?.message ?? dupError ?? undefined}
          />

          {/* Category — pick a preset or type a custom one. */}
          <Input
            label="Category"
            required
            list="menu-categories"
            placeholder="Pick or type — e.g. Meals"
            {...register("category")}
            error={errors.category?.message}
          />
          <datalist id="menu-categories">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

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
