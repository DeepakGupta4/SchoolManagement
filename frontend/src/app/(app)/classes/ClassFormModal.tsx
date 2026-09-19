"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Modal, Button, Input, Select, MultiSelect } from "@/components/ui";
import { Field } from "@/components/ui/Input";
import { schoolClassSchema, type SchoolClassSchema } from "@/lib/schemas/schoolClass";
import { STREAM_OPTIONS, SECTION_OPTIONS, type SchoolClass } from "@/lib/api/classes";
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
  saving?: boolean;
  onSubmit: (values: SchoolClassSchema) => Promise<void>;
}

export function ClassFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: ClassFormModalProps) {
  const isEdit = Boolean(record);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

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

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
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

  const submit = handleSubmit(onSubmit);

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
            error={errors.name?.message}
          />
          <datalist id="grade-presets">
            {GRADE_PRESETS.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          <Select
            label="Stream"
            required
            options={STREAM_OPTIONS.map((s) => ({ label: s, value: s }))}
            {...register("stream")}
            error={errors.stream?.message}
          />
          <Input label="Room(s)" placeholder="e.g. 101-103" {...register("room")} error={errors.room?.message} />
        </div>

        <Controller
          control={control}
          name="sections"
          render={({ field }) => (
            <MultiSelect
              label="Sections"
              required
              options={SECTION_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.sections?.message}
            />
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
