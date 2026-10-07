"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, X, GraduationCap } from "lucide-react";
import {
  Modal,
  Button,
  Input,
  Select,
  Textarea,
  Field,
  controlClasses,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { parentSchema, type ParentSchema } from "@/lib/schemas/parent";
import { digitsOnly10 } from "@/lib/phone";
import { RELATION_OPTIONS, type Parent } from "@/lib/api/parent";
import { listStudents } from "@/lib/api/students";
import { fullName, type Student } from "@/types/student";

// Common parent/guardian occupations — a quick pick, but the field stays free
// text so any custom occupation works.
const OCCUPATION_PRESETS = [
  "Business", "Government Service", "Private Job", "Doctor", "Engineer",
  "Teacher", "Lawyer", "Farmer", "Self-employed", "Homemaker", "Retired",
];

const emptyValues: ParentSchema = {
  name: "",
  relation: "Father",
  phone: "",
  email: "",
  occupation: "",
  address: "",
  students: [],
};

interface ParentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Parent | null;
  /** Existing parents (id + email) — used to block a duplicate email. */
  existing?: { id: string; email: string }[];
  saving?: boolean;
  onSubmit: (values: ParentSchema) => Promise<void>;
}

export function ParentFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: ParentFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);
  // Roster powering the student picker. Loaded whenever the modal opens.
  const [roster, setRoster] = useState<Student[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
    // Deferred: clearing the duplicate-email error synchronously in an effect
    // trips the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Load the student roster (all statuses, so an edited parent's children always
  // resolve). Set only inside the async callbacks — never synchronously.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listStudents()
      .then((all) => !cancelled && setRoster(all))
      .catch(() => !cancelled && setRoster([]));
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Case-insensitive set of emails already taken by *other* parents.
  const takenEmails = useMemo(() => {
    const set = new Set<string>();
    for (const p of existing) {
      if (record && p.id === record.id) continue;
      if (p.email) set.add(p.email.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  const submit = handleSubmit(async (values) => {
    const email = values.email.trim();
    if (takenEmails.has(email.toLowerCase())) {
      setDupError(`A parent with the email "${email}" already exists.`);
      return;
    }
    setDupError(null);
    await onSubmit({ ...values, email });
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit parent" : "Add parent / guardian"}
      description={
        isEdit
          ? "Update this parent record and their linked children. Changes apply immediately."
          : "Create a parent record and link the student(s) in their care."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add parent"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            required
            placeholder="Mr. Rakesh Sharma"
            {...register("name")}
            error={errors.name?.message}
          />
          <Select
            label="Relation"
            required
            options={RELATION_OPTIONS}
            {...register("relation")}
            error={errors.relation?.message}
          />
          <Input
            label="Phone"
            required
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            {...register("phone", { onChange: digitsOnly10 })}
            error={errors.phone?.message}
          />
          <Input
            label="Email"
            required
            type="email"
            placeholder="name@example.com"
            {...register("email")}
            error={errors.email?.message ?? dupError ?? undefined}
          />

          {/* Occupation — pick a preset or type a custom one. */}
          <Input
            label="Occupation"
            list="parent-occupations"
            placeholder="Pick or type — e.g. Business"
            {...register("occupation")}
            error={errors.occupation?.message}
          />
          <datalist id="parent-occupations">
            {OCCUPATION_PRESETS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>

        <Textarea
          label="Address"
          placeholder="Residential address"
          {...register("address")}
          error={errors.address?.message}
        />

        <Controller
          control={control}
          name="students"
          render={({ field }) => (
            <StudentPicker
              roster={roster}
              value={field.value}
              onChange={field.onChange}
              error={errors.students?.message}
            />
          )}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

/**
 * Searchable multi-picker for linking students to a parent. Type to search the
 * roster by name, admission or roll number; picks show as removable chips.
 * Value is an array of student ids.
 */
function StudentPicker({
  roster,
  value,
  onChange,
  error,
}: {
  roster: Student[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const byId = useMemo(() => {
    const map = new Map<string, Student>();
    roster.forEach((s) => map.set(s.id, s));
    return map;
  }, [roster]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return roster
      .filter((s) => !value.includes(s.id))
      .filter(
        (s) =>
          fullName(s).toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [roster, value, query]);

  const showList = focused && query.trim() !== "" && suggestions.length > 0;

  const add = (id: string) => {
    onChange([...value, id]);
    setQuery("");
  };
  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <Field
      label="Linked students"
      error={error}
      hint="Search by name, admission or roll number, then pick to link. Optional — you can link children later."
    >
      <div className="flex flex-col gap-2">
        {/* Selected children as removable chips */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.map((id) => {
              const s = byId.get(id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft py-1 pl-2.5 pr-1 text-xs font-medium text-primary-text"
                >
                  <GraduationCap className="size-3" />
                  <span className="max-w-40 truncate">
                    {s ? fullName(s) : "Linked student"}
                    {s ? ` · ${s.className}-${s.section}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    aria-label={`Unlink ${s ? fullName(s) : "student"}`}
                    className="focus-ring rounded-full p-0.5 text-primary-text/70 transition-colors hover:bg-primary/20 hover:text-primary-text"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Search box + suggestions dropdown */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Type to search students…"
            className={cn(controlClasses, "pl-9")}
            aria-label="Search students to link"
          />

          {showList && (
            <ul className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-md border border-border bg-surface-raised py-1 shadow-lg">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    // onMouseDown fires before input blur, so the pick lands
                    // before the dropdown is torn down.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(s.id);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-text">{fullName(s)}</span>
                      <span className="block truncate text-xs text-subtle">
                        {s.className} · Section {s.section} · Roll {s.rollNo}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted">{s.admissionNo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Field>
  );
}
