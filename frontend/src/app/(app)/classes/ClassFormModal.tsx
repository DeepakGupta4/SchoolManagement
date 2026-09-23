"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Modal, Button, Input } from "@/components/ui";
import { Field } from "@/components/ui/Input";
import {
  schoolClassSchema,
  SECTION_SEQUENCE,
  type SchoolClassSchema,
} from "@/lib/schemas/schoolClass";
import { STREAM_OPTIONS, type SchoolClass } from "@/lib/api/classes";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName, type Teacher } from "@/types/teacher";

// Common Indian-school grades — offered as a quick pick, but the name field is
// still free text so any custom class name works.
const GRADE_PRESETS = [
  "Nursery", "LKG", "UKG", "Prep",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
  "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

const emptyValues: SchoolClassSchema = {
  name: "",
  sections: ["A"],
  stream: STREAM_OPTIONS[0],
  classTeacher: "",
  room: "",
  students: 0,
  teachers: 0,
};

interface ClassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: SchoolClass | null;
  /** Existing classes — used to block a duplicate class name. */
  existing?: SchoolClass[];
  saving?: boolean;
  onSubmit: (values: SchoolClassSchema) => Promise<void>;
}

export function ClassFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: ClassFormModalProps) {
  const isEdit = Boolean(record);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [dupError, setDupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<SchoolClassSchema>({
    resolver: zodResolver(schoolClassSchema),
    defaultValues: emptyValues,
  });

  const selectedTeacher = useWatch({ control, name: "classTeacher" });
  const sections = useWatch({ control, name: "sections" }) ?? [];

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
    // Deferred: clearing the duplicate-name error synchronously in an effect
    // trips the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Load real teachers for the class-teacher picker.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listTeachers()
      .then((all) => !cancelled && setTeachers(all))
      .catch(() => !cancelled && setTeachers([]));
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Case-insensitive set of names already taken by *other* classes.
  const takenNames = useMemo(() => {
    const set = new Set<string>();
    for (const c of existing) {
      if (record && c.id === record.id) continue;
      set.add(c.name.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    if (takenNames.has(name.toLowerCase())) {
      setDupError(`"${name}" already exists. Pick a different class name.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, name, stream: values.stream.trim() });
  });

  /** Tap a letter → sections become A through that letter (always gap-free). */
  const pickUpTo = (index: number) =>
    setValue("sections", SECTION_SEQUENCE.slice(0, index + 1) as string[], {
      shouldDirty: true,
      shouldValidate: true,
    });

  const sectionCount = sections.length;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit class" : "Add new class"}
      description={
        isEdit
          ? "Update this class. Changes apply immediately."
          : "Pick a class name and section(s). Student & teacher counts update automatically."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create class"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Class name"
            required
            list="grade-presets"
            placeholder="Pick or type — e.g. Class 6"
            {...register("name")}
            error={errors.name?.message ?? dupError ?? undefined}
          />
          <datalist id="grade-presets">
            {GRADE_PRESETS.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>

          {/* Stream — pick a preset or type a custom one (same as class name). */}
          <Input
            label="Stream"
            required
            list="stream-presets"
            placeholder="Pick or type — e.g. Science"
            {...register("stream")}
            error={errors.stream?.message}
          />
          <datalist id="stream-presets">
            {STREAM_OPTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <Input label="Room(s)" placeholder="e.g. 101-103" {...register("room")} error={errors.room?.message} />
        </div>

        {/* Sections — always a gap-free run from A. Tapping a letter sets the
            range A→that letter, so you can never create D without A, B and C. */}
        <Controller
          control={control}
          name="sections"
          render={() => (
            <Field
              label="Sections"
              required
              hint={`Tap a letter to set sections A through it — ${sectionCount} section${sectionCount === 1 ? "" : "s"} (${sections.join(", ")})`}
              error={errors.sections?.message}
            >
              <div
                role="group"
                aria-label="Sections"
                className="flex flex-wrap gap-1.5 rounded-md border border-border bg-surface p-2"
              >
                {SECTION_SEQUENCE.map((letter, i) => {
                  const selected = i < sectionCount;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => pickUpTo(i)}
                      aria-pressed={selected}
                      className={`focus-ring inline-flex size-9 items-center justify-center rounded-md text-sm font-semibold transition-colors ${
                        selected
                          ? "bg-primary text-white"
                          : "bg-surface-hover text-muted hover:text-text"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
        />

        {/* Class-teacher picker — a scrollable strip of real teachers */}
        <Field label="Class teacher" hint="Optional — tap a teacher to assign, tap again to clear">
          {teachers.length === 0 ? (
            <p className="rounded-md border border-dashed border-border-strong bg-surface-sunken px-3 py-3 text-xs text-subtle">
              No teachers yet — add teachers first, then assign a class teacher here.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {teachers.map((t) => {
                const name = teacherName(t);
                const active = selectedTeacher === name;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setValue("classTeacher", active ? "" : name, { shouldDirty: true })}
                    aria-pressed={active}
                    className={`focus-ring inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary-soft text-primary-text"
                        : "border-border bg-surface text-muted hover:border-border-strong hover:text-text"
                    }`}
                  >
                    {active && <Check className="size-3.5" />}
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
