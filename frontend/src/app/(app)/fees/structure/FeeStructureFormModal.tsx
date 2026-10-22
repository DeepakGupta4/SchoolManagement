"use client";

import { useEffect, useMemo, useState, type BaseSyntheticEvent } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Modal, Button, Input, Field, Select, type SelectOption } from "@/components/ui";
import { feeStructureSchema, type FeeStructureSchema } from "@/lib/schemas/feeStructure";
import {
  COMMON_FEE_HEADS,
  DEFAULT_EXAMS_PER_YEAR,
  DEFAULT_MONTHS_PER_YEAR,
  FREQUENCY_LABELS,
  annualTotal,
  feeBreakdown,
  structureHeads,
  type FeeFrequency,
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

// Frequency choices for each head's <Select>, derived from the shared labels so
// the wording stays in one place: Monthly / One-time / Per-exam.
const FREQUENCY_OPTIONS: SelectOption[] = (
  Object.entries(FREQUENCY_LABELS) as [FeeFrequency, string][]
).map(([value, label]) => ({ value, label }));

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// Create-mode default: one sensible head so the editor is never empty. Tuition
// recurs monthly. Months/exams per year default to the usual Indian session.
const emptyValues: FeeStructureSchema = {
  code: "",
  class: "",
  heads: [{ name: "Tuition", amount: 0, frequency: "monthly" }],
  monthsPerYear: DEFAULT_MONTHS_PER_YEAR,
  examsPerYear: DEFAULT_EXAMS_PER_YEAR,
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
  // edit, structureHeads() returns heads WITH their frequency (legacy fixed
  // columns are classified by name), so they load back in as-is.
  useEffect(() => {
    if (!open) return;
    if (record) {
      const heads = structureHeads(record);
      reset({
        code: record.code,
        class: record.class,
        heads: heads.length ? heads : [{ name: "", amount: 0, frequency: "one-time" }],
        monthsPerYear: record.monthsPerYear ?? DEFAULT_MONTHS_PER_YEAR,
        examsPerYear: record.examsPerYear ?? DEFAULT_EXAMS_PER_YEAR,
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

  // Live heads drive the running breakdown and the preset "already added" state.
  const watchedHeads = watch("heads") ?? [];
  const breakdown = feeBreakdown(watchedHeads);
  // Cadence drives the annual (session) bill — monthly heads × months, exams × exams.
  const months = Number(watch("monthsPerYear")) || DEFAULT_MONTHS_PER_YEAR;
  const exams = Number(watch("examsPerYear")) || 0;
  const annual = annualTotal(watchedHeads, months, exams);
  const hasHead = (name: string) =>
    watchedHeads.some((h) => h.name.trim().toLowerCase() === name.trim().toLowerCase());

  // Preset chip: append the head (with its usual frequency) only if that name
  // isn't already in the list.
  const addPreset = (head: (typeof COMMON_FEE_HEADS)[number]) => {
    if (!hasHead(head.name)) append({ name: head.name, amount: 0, frequency: head.frequency });
  };

  const onValid = (values: FeeStructureSchema) => {
    const cls = values.class.trim();
    if (takenClasses.has(cls.toLowerCase())) {
      setDupError(`A fee structure for "${cls}" already exists.`);
      return;
    }
    setDupError(null);
    // Defensive: blank-name rows are already pruned before validation, but keep
    // the payload clean and carry each head's frequency through.
    const heads = values.heads
      .map((h) => ({ name: h.name.trim(), amount: Number(h.amount) || 0, frequency: h.frequency }))
      .filter((h) => h.name.length > 0);
    return onSubmit({
      code: values.code.trim(),
      class: cls,
      heads,
      monthsPerYear: values.monthsPerYear,
      examsPerYear: values.examsPerYear,
    });
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
          ? "Update this class's fee heads. Totals are recalculated automatically."
          : "Define a class's fee heads and how often each is charged. The class must be unique."
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

        {/* Dynamic fee heads — one editable name + amount + frequency per row. */}
        <Field label="Fee heads" error={headsError}>
          <div className="flex flex-col gap-2">
            {fields.length > 0 && (
              <div className="hidden items-center gap-2 px-0.5 text-xs font-medium text-subtle sm:flex">
                <span className="flex-1">Head</span>
                <span className="w-28">Amount (₹)</span>
                <span className="w-36">Frequency</span>
                <span className="w-9 shrink-0" aria-hidden />
              </div>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-start gap-2">
                {/* Name — full width on phone, flexes alongside on wider screens. */}
                <div className="min-w-0 basis-full sm:flex-1">
                  <Input
                    aria-label={`Fee head ${index + 1} name`}
                    placeholder="e.g. Tuition"
                    {...register(`heads.${index}.name`)}
                    error={errors.heads?.[index]?.name?.message}
                  />
                </div>
                <div className="w-24 shrink-0 sm:w-28">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    aria-label={`Fee head ${index + 1} amount`}
                    {...register(`heads.${index}.amount`)}
                    error={errors.heads?.[index]?.amount?.message}
                  />
                </div>
                <div className="min-w-0 flex-1 sm:w-36 sm:flex-none">
                  <Select
                    aria-label={`Fee head ${index + 1} frequency`}
                    options={FREQUENCY_OPTIONS}
                    {...register(`heads.${index}.frequency`)}
                    error={errors.heads?.[index]?.frequency?.message}
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
            {COMMON_FEE_HEADS.map((head) => {
              const added = hasHead(head.name);
              return (
                <button
                  key={head.name}
                  type="button"
                  disabled={added}
                  onClick={() => addPreset(head)}
                  className="focus-ring rounded-full border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + {head.name}
                </button>
              );
            })}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", amount: 0, frequency: "one-time" })}
            >
              <Plus className="size-4" />
              Add another
            </Button>
          </div>
          {/* Transport is charged per route (by distance), not as a flat class fee,
              so it's set up elsewhere — point the user there to avoid confusion. */}
          <p className="mt-1 rounded-md bg-surface px-3 py-2 text-xs text-subtle">
            <span className="font-medium text-muted">Bus / transport fee?</span> It&rsquo;s charged
            per route — set each route&rsquo;s monthly fee under{" "}
            <span className="font-medium text-muted">Transport</span>, then pick the student&rsquo;s
            route at admission and it&rsquo;s billed automatically. The &ldquo;Transport&rdquo; head
            here is only a flat fallback.
          </p>
        </div>

        {/* Billing cadence — how many monthly instalments a session runs over, and
            how many exams it has. These multiply the per-period amounts into the
            annual bill and decide how many times each head is collected. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Months per year"
            type="number"
            min={1}
            max={12}
            inputMode="numeric"
            hint="Monthly heads are billed this many times (e.g. 12)."
            {...register("monthsPerYear")}
            error={errors.monthsPerYear?.message}
          />
          <Input
            label="Exams per year"
            type="number"
            min={0}
            max={20}
            inputMode="numeric"
            hint="Per-exam heads are billed once for each exam."
            {...register("examsPerYear")}
            error={errors.examsPerYear?.message}
          />
        </div>

        {/* Honest breakdown by cadence — tuition recurs monthly, admission/ID/etc.
            are one-time, exams are per-exam. Monthly always shows; the others
            only when they actually bill something. The annual line is the full
            session bill, which is what the student is billed and collected against. */}
        <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Monthly</span>
            <span className="text-base font-semibold text-primary">
              {inr.format(breakdown.monthly)}
              <span className="text-sm font-normal text-muted">/mo</span>
            </span>
          </div>
          {breakdown.oneTime > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">One-time</span>
              <span className="text-base font-semibold text-primary">
                {inr.format(breakdown.oneTime)}
              </span>
            </div>
          )}
          {breakdown.perExam > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Per-exam</span>
              <span className="text-base font-semibold text-primary">
                {inr.format(breakdown.perExam)}
                <span className="text-sm font-normal text-muted">/exam</span>
              </span>
            </div>
          )}
          <div className="mt-0.5 flex items-center justify-between border-t border-border pt-2">
            <span className="text-sm font-semibold text-foreground">Annual bill</span>
            <span className="text-lg font-bold text-foreground">
              {inr.format(annual)}
              <span className="text-sm font-normal text-muted">/year</span>
            </span>
          </div>
          <p className="text-xs text-subtle">
            Full session fee ({months} monthly instalment{months === 1 ? "" : "s"}
            {exams > 0 ? ` + ${exams} exam${exams === 1 ? "" : "s"}` : ""}). Collected in parts.
          </p>
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
