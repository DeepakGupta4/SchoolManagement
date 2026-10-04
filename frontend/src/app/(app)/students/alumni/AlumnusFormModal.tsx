"use client";

import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Modal, Button, Input, MultiSelect, Select } from "@/components/ui";
import { Field, controlClasses } from "@/components/ui/Input";
import { alumnusSchema, type AlumnusSchema } from "@/lib/schemas/alumnus";
import { digitsOnly10 } from "@/lib/phone";
import {
  BATCH_OPTIONS,
  CITY_OPTIONS,
  INTEREST_OPTIONS,
  STREAM_OPTIONS,
  type Alumnus,
} from "@/lib/api/alumni";
import { fetchAllStudents } from "@/lib/api/students";
import { fullName, type Student } from "@/types/student";
import { cn } from "@/lib/utils";

const emptyValues: AlumnusSchema = {
  studentId: "",
  name: "",
  batch: BATCH_OPTIONS[0],
  stream: STREAM_OPTIONS[0],
  occupation: "",
  employer: "",
  city: "",
  email: "",
  phone: "",
  mentor: "no",
  interests: [],
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 mt-1 text-xs font-semibold uppercase tracking-wide text-subtle">{children}</p>
  );
}

interface AlumnusFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Alumnus | null;
  saving?: boolean;
  onSubmit: (values: AlumnusSchema) => Promise<void>;
}

export function AlumnusFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: AlumnusFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<AlumnusSchema>({
    resolver: zodResolver(alumnusSchema),
    defaultValues: emptyValues,
  });

  // Student roster for the name autocomplete (create mode only).
  const [roster, setRoster] = useState<Student[]>([]);
  const [focused, setFocused] = useState(false);
  // In edit mode there's nothing to look up, so the dropdown stays closed.
  const [picked, setPicked] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);

  const nameValue = useWatch({ control, name: "name" });
  const studentIdValue = useWatch({ control, name: "studentId" });

  // Repopulate on open so the previous record's values can't leak through.
  // `mentor` is a boolean on the record but a yes/no select in the form.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record, mentor: record.mentor ? "yes" : "no" } : emptyValues);
    const t = setTimeout(() => {
      setPicked(true);
      setFocused(false);
      setActiveIndex(-1);
    }, 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  useEffect(() => {
    if (!open || isEdit) return;
    let cancelled = false;
    // Whole roster (all pages) so any passed-out student is searchable.
    fetchAllStudents()
      .then((all) => !cancelled && setRoster(all))
      .catch(() => !cancelled && setRoster([]));
    return () => {
      cancelled = true;
    };
  }, [open, isEdit]);

  const suggestions = useMemo(() => {
    const q = (nameValue ?? "").trim().toLowerCase();
    if (!q) return [];
    return roster
      .filter(
        (s) =>
          fullName(s).toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [roster, nameValue]);

  const showList = focused && !picked && suggestions.length > 0;

  const pick = (s: Student) => {
    setValue("name", fullName(s), { shouldValidate: true });
    setValue("studentId", s.admissionNo, { shouldValidate: true });
    if (s.email) setValue("email", s.email, { shouldValidate: true });
    if (s.phone) setValue("phone", s.phone, { shouldValidate: true });
    // Graduation year (from the promotion session) -> batch, when known & in range.
    const yr = (s.lastPromotedSession ?? "").slice(0, 4);
    if (/^\d{4}$/.test(yr) && BATCH_OPTIONS.includes(yr)) {
      setValue("batch", yr, { shouldValidate: true });
    }
    setPicked(true);
    setActiveIndex(-1);
  };

  const onNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showList) {
        setPicked(false);
        setActiveIndex(suggestions.length > 0 ? 0 : -1);
      } else {
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      if (!showList) return;
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (showList && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault(); // pick the highlighted student instead of submitting
        pick(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (showList) {
        e.preventDefault();
        setPicked(true);
        setActiveIndex(-1);
      }
    }
  };

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit alumnus" : "Add alumnus"}
      description={
        isEdit
          ? "Update this record. Changes apply immediately."
          : "Start typing a student's name to pull their details, or enter a passed-out student manually. Email must be unique."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add alumnus"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <section>
          <SectionTitle>Student</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full name — autocomplete against the student roster (create mode) */}
            <div className="relative sm:col-span-2">
              <Field label="Full name" required error={errors.name?.message}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                  <input
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls="alumni-student-list"
                    aria-autocomplete="list"
                    aria-activedescendant={
                      showList && activeIndex >= 0 ? `alumni-opt-${activeIndex}` : undefined
                    }
                    placeholder={isEdit ? "Rohan Deshpande" : "Type to search students…"}
                    className={cn(controlClasses, "pl-9", errors.name && "border-danger")}
                    {...register("name", {
                      onChange: () => {
                        setPicked(false);
                        setActiveIndex(-1);
                        // Editing the name breaks the link to a previously picked student.
                        if (!isEdit) setValue("studentId", "");
                      },
                    })}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={onNameKeyDown}
                  />
                </div>
              </Field>

              {!isEdit && (
                <p className="mt-1 text-xs text-subtle">
                  {studentIdValue
                    ? `Linked to student ${studentIdValue}`
                    : "Pick a student to auto-fill their email, phone & batch — or just type a name."}
                </p>
              )}

              {showList && (
                <ul
                  id="alumni-student-list"
                  role="listbox"
                  className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-md border border-border bg-surface-raised py-1 shadow-lg"
                >
                  {suggestions.map((s, i) => (
                    <li key={s.id} role="option" id={`alumni-opt-${i}`} aria-selected={i === activeIndex}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pick(s);
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover",
                          i === activeIndex && "bg-surface-hover"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-text">{fullName(s)}</span>
                          <span className="block truncate text-xs text-subtle">
                            {s.className} · Section {s.section} · {s.status}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted">{s.admissionNo}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Select
              label="Batch"
              required
              options={BATCH_OPTIONS.map((b) => ({ label: `Batch of ${b}`, value: b }))}
              {...register("batch")}
              error={errors.batch?.message}
            />
            <Select
              label="Stream"
              required
              options={STREAM_OPTIONS.map((s) => ({ label: s, value: s }))}
              {...register("stream")}
              error={errors.stream?.message}
            />
          </div>
        </section>

        <section>
          <SectionTitle>Career</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Occupation"
              required
              placeholder="Software Engineer"
              {...register("occupation")}
              error={errors.occupation?.message}
            />
            <Input
              label="Employer"
              required
              placeholder="Infosys"
              {...register("employer")}
              error={errors.employer?.message}
            />
            <Input
              label="City"
              required
              list="alumni-city-list"
              placeholder="Pick or type a city"
              {...register("city")}
              error={errors.city?.message}
            />
            <datalist id="alumni-city-list">
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </section>

        <section>
          <SectionTitle>Contact</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              required
              placeholder="rohan.d@example.in"
              {...register("email")}
              error={errors.email?.message}
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
          </div>
        </section>

        <section>
          <SectionTitle>Alumni engagement</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Volunteer mentor"
              required
              options={[
                { label: "No", value: "no" },
                { label: "Yes", value: "yes" },
              ]}
              {...register("mentor")}
              error={errors.mentor?.message}
            />
          </div>
          <div className="mt-4">
            <Controller
              control={control}
              name="interests"
              render={({ field }) => (
                <MultiSelect
                  label="Willing to help with"
                  options={INTEREST_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.interests?.message}
                />
              )}
            />
          </div>
        </section>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
