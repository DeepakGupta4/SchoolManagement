"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { holidaySchema, type HolidaySchema } from "@/lib/schemas/holiday";
import { HOLIDAY_TYPE_OPTIONS, type Holiday } from "@/lib/api/holidays";

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyValues = (): HolidaySchema => ({
  date: todayIso(),
  name: "",
  type: "Holiday",
});

interface HolidayFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Holiday | null;
  saving?: boolean;
  onSubmit: (values: HolidaySchema) => Promise<void>;
}

export function HolidayFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: HolidayFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HolidaySchema>({
    resolver: zodResolver(holidaySchema),
    defaultValues: emptyValues(),
  });

  // Repopulate on open so a previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { date: record.date, name: record.name, type: record.type } : emptyValues());
  }, [open, record, reset]);

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit holiday" : "Add holiday"}
      description={
        isEdit
          ? "Update this closed day. Changes apply immediately."
          : "Mark a day the school is closed. No one is marked absent on this date."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add holiday"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            required
            {...register("date")}
            error={errors.date?.message}
          />
          <Select
            label="Type"
            options={HOLIDAY_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("type")}
            error={errors.type?.message}
          />
          <div className="sm:col-span-2">
            <Input
              label="Name"
              required
              placeholder="e.g. Independence Day"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
