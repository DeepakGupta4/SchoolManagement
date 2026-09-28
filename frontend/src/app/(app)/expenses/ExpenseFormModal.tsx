"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { expenseSchema, type ExpenseSchema } from "@/lib/schemas/expense";
import {
  CATEGORY_OPTIONS,
  METHOD_OPTIONS,
  STATUS_OPTIONS,
  type Expense,
} from "@/lib/api/expenses";
import { MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";

/**
 * Normalises a stored date to the yyyy-mm-dd the native picker expects. New rows
 * already use it; a legacy `"Mmm dd, yyyy"` row is converted so it opens cleanly
 * in edit mode. Deterministic string parse — no clock read.
 */
function toIsoDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const emptyValues: ExpenseSchema = {
  voucherNo: "",
  title: "",
  category: CATEGORY_OPTIONS[0],
  amount: 0,
  date: TODAY_ISO,
  paidTo: "",
  method: METHOD_OPTIONS[0],
  status: "pending",
  recurring: "no",
  notes: "",
};

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Expense | null;
  saving?: boolean;
  onSubmit: (values: ExpenseSchema) => Promise<void>;
}

export function ExpenseFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: ExpenseFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  // `recurring` is a boolean on the record but a yes/no select in the form.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? { ...record, date: toIsoDate(record.date), recurring: record.recurring ? "yes" : "no" }
        : emptyValues
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit expense" : "Add expense"}
      description={
        isEdit
          ? "Update this voucher. Changes apply immediately."
          : "Record an expenditure. The voucher number must be unique."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Voucher number"
            required
            placeholder="EXP011"
            {...register("voucherNo")}
            error={errors.voucherNo?.message}
          />
          <Input
            label="Title"
            required
            placeholder="Electricity Bill"
            {...register("title")}
            error={errors.title?.message}
          />
          <Select
            label="Category"
            required
            options={CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("category")}
            error={errors.category?.message}
          />
          <Input
            label="Amount (₹)"
            type="number"
            min={1}
            step="0.01"
            required
            {...register("amount")}
            error={errors.amount?.message}
          />
          <Input
            label="Date"
            required
            type="date"
            min={MIN_RECORD_DATE}
            max={TODAY_ISO}
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Paid to"
            required
            placeholder="BSES Rajdhani"
            {...register("paidTo")}
            error={errors.paidTo?.message}
          />
          <Select
            label="Payment method"
            required
            options={METHOD_OPTIONS.map((m) => ({ label: m, value: m }))}
            {...register("method")}
            error={errors.method?.message}
          />
          <Select
            label="Status"
            required
            options={STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Select
            label="Recurring"
            required
            options={[
              { label: "No", value: "no" },
              { label: "Yes", value: "yes" },
            ]}
            {...register("recurring")}
            error={errors.recurring?.message}
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Anything the accounts team should know…"
          {...register("notes")}
          error={errors.notes?.message}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
