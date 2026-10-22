"use client";

import { useEffect, useMemo, useState, type BaseSyntheticEvent } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Modal, Button, Input, Field } from "@/components/ui";
import { feeStructureSchema, type FeeStructureSchema } from "@/lib/schemas/feeStructure";
import {
  COMMON_FEE_HEADS,
  feeTotal,
  structureHeads,
  type FeeStructure,
} from "@/lib/api/feeStructures";

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

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// Create-mode default: one sensible head so the editor is never empty.
const emptyValues: FeeStructureSchema = {
  code: "",
  class: "",
  heads: [{ name: "Tuition", amount: 0 }],
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
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FeeStructureSchema>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "heads" });

  // Repopulate on open so the previous record's values can't leak through. On
  // edit, legacy fixed columns come through structureHeads() as editable heads.
  useEffect(() => {
    if (!open) return;
    if (record) {
      const heads = structureHeads(record);
      reset({
        code: record.code,
        class: record.class,
        heads: heads.length ? heads : [{ name: "", amount: 0 }],
      });
    } else {
      reset(emptyValues);
    }
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

  // Live heads drive the running total and the preset "already added" state.
  const watchedHeads = watch("heads") ?? [];
  const runningTotal = feeTotal({ heads: watchedHeads } as FeeStructure);
  const hasHead = (name: string) =>
    watchedHeads.some((h) => h.name.trim().toLowerCase() === name.trim().toLowerCase());

  // Preset chip: append the head only if that name isn't already in the list.
  const addPreset = (name: string) => {
    if (!hasHead(name)) append({ name, amount: 0 });
  };

  const onValid = (values: FeeStructureSchema) => {
    const cls = values.class.trim();
    if (takenClasses.has(cls.toLowerCase())) {
      setDupError(`A fee structure for "${cls}" already exists.`);
      return;
    }
    setDupError(null);
    // Defensive: blank-name rows are already pruned before validation, but keep
    // the payload clean and send no legacy columns.
    const heads = values.heads
      .map((h) => ({ name: h.name.trim(), amount: Number(h.amount) || 0 }))
      .filter((h) => h.name.length > 0);
    return onSubmit({ code: values.code.trim(), class: cls, heads });
  };

  // Drop any blank-name rows up-front so a stray "Add another" row the user
  // left empty is silently dropped instead of blocking submit on validation.
  const submit = (e?: BaseSyntheticEvent) => {
    const current = getValues("heads") ?? [];
    for (let i = current.length - 1; i >= 0; i--) {
      if (!current[i]?.name?.trim()) remove(i);
    }
    return handleSubmit(onValid)(e);
  };

  const headsError = errors.heads?.root?.message ?? errors.heads?.message;

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
      <form onSubmit={submit} className="flex flex-col gap-5">
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
        </div>

        {/* Dynamic fee heads — one editable name + amount per row. */}
        <Field label="Fee heads" error={headsError}>
          <div className="flex flex-col gap-2">
            {fields.length > 0 && (
              <div className="flex items-center gap-2 px-0.5 text-xs font-medium text-subtle">
                <span className="flex-1">Head</span>
                <span className="w-28 sm:w-36">Amount (₹)</span>
                <span className="w-9 shrink-0" aria-hidden />
              </div>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    aria-label={`Fee head ${index + 1} name`}
                    placeholder="e.g. Tuition"
                    {...register(`heads.${index}.name`)}
                    error={errors.heads?.[index]?.name?.message}
                  />
                </div>
                <div className="w-28 sm:w-36">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    aria-label={`Fee head ${index + 1} amount`}
                    {...register(`heads.${index}.amount`)}
                    error={errors.heads?.[index]?.amount?.message}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove fee head ${index + 1}`}
                  className="focus-ring mt-1 w-9 shrink-0 rounded-md p-2 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </Field>

        {/* Quick-add presets + a fully custom row. */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-subtle">Quick add a head</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_FEE_HEADS.map((name) => {
              const added = hasHead(name);
              return (
                <button
                  key={name}
                  type="button"
                  disabled={added}
                  onClick={() => addPreset(name)}
                  className="focus-ring rounded-full border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + {name}
                </button>
              );
            })}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", amount: 0 })}
            >
              <Plus className="size-4" />
              Add another
            </Button>
          </div>
        </div>

        {/* Running total of whatever is currently entered. */}
        <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
          <span className="text-sm font-medium text-muted">Monthly total</span>
          <span className="text-base font-semibold text-primary">{inr.format(runningTotal)}</span>
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
