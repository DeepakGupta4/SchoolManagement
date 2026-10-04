"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { Field, controlClasses } from "@/components/ui/Input";
import { transferSchema, type TransferSchema } from "@/lib/schemas/transfer";
import {
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  type TransferRequest,
} from "@/lib/api/transfers";
import { fetchAllStudents } from "@/lib/api/students";
import { useClassOptions } from "@/hooks/useClassOptions";
import { MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";
import { fullName, type Student } from "@/types/student";
import { cn } from "@/lib/utils";

const emptyValues: TransferSchema = {
  name: "",
  studentId: "",
  className: "",
  type: TYPE_OPTIONS[0].value,
  reason: "",
  requestedOn: TODAY_ISO,
  issuedOn: "—",
  tcNo: "—",
  status: "pending",
  dues: 0,
};

interface TransferFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: TransferRequest | null;
  saving?: boolean;
  onSubmit: (values: TransferSchema) => Promise<void>;
}

export function TransferFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: TransferFormModalProps) {
  const isEdit = Boolean(record);
  const { classOptions } = useClassOptions();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TransferSchema>({
    resolver: zodResolver(transferSchema),
    defaultValues: emptyValues,
  });

  // Roster for the name autocomplete. Loaded once per open in create mode.
  const [roster, setRoster] = useState<Student[]>([]);
  const [focused, setFocused] = useState(false);
  // In edit mode there's nothing to look up, so the dropdown stays closed
  // until the operator actively edits the name.
  const [picked, setPicked] = useState(true);
  // Keyboard-highlighted suggestion (-1 = none).
  const [activeIndex, setActiveIndex] = useState(-1);

  const nameValue = useWatch({ control, name: "name" });
  const classValue = useWatch({ control, name: "className" });
  const typeValue = useWatch({ control, name: "type" });
  const statusValue = useWatch({ control, name: "status" });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
    // Deferred so the reset paints before the dropdown state is cleared.
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
    // Whole active roster (all pages) so even students past the first page are
    // searchable — a capped page would hide them from the autocomplete.
    fetchAllStudents({ status: "active" })
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
      .filter((s) => !classValue || s.className === classValue)
      .filter(
        (s) =>
          fullName(s).toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [roster, nameValue, classValue]);

  const showList = focused && !picked && suggestions.length > 0;

  const pick = (s: Student) => {
    setValue("name", fullName(s), { shouldValidate: true });
    setValue("studentId", s.admissionNo, { shouldValidate: true });
    setValue("className", s.className, { shouldValidate: true });
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
      title={isEdit ? "Edit request" : "New transfer request"}
      description={
        isEdit
          ? "Update this request. Changes apply immediately."
          : "Pick the class, then start typing the student's name to auto-fill their details."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create request"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Class"
            required
            placeholder="Select class"
            options={classOptions}
            {...register("className")}
            error={errors.className?.message}
          />

          {/* Student name autocomplete — filtered by the selected class */}
          <div className="relative">
            <Field label="Student name" required error={errors.name?.message}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                <input
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showList}
                  aria-controls="transfer-student-list"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    showList && activeIndex >= 0 ? `transfer-opt-${activeIndex}` : undefined
                  }
                  placeholder={isEdit ? "Aarav Sharma" : "Type to search students…"}
                  className={cn(controlClasses, "pl-9", errors.name && "border-danger")}
                  {...register("name", {
                    onChange: () => {
                      setPicked(false);
                      setActiveIndex(-1);
                      // Typing invalidates a previously auto-filled ID.
                      if (!isEdit) setValue("studentId", "");
                    },
                  })}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={onNameKeyDown}
                />
              </div>
            </Field>

            {showList && (
              <ul
                id="transfer-student-list"
                role="listbox"
                className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-md border border-border bg-surface-raised py-1 shadow-lg"
              >
                {suggestions.map((s, i) => (
                  <li key={s.id} role="option" id={`transfer-opt-${i}`} aria-selected={i === activeIndex}>
                    <button
                      type="button"
                      // onMouseDown fires before input blur, so the pick lands
                      // before the dropdown is torn down.
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

          <Input
            label="Student ID / Admission no."
            required
            placeholder="ADM-2026-0007"
            hint={!isEdit ? "Auto-filled from the selected student" : undefined}
            {...register("studentId")}
            error={errors.studentId?.message}
          />
          <Select
            label="Request type"
            required
            options={TYPE_OPTIONS}
            {...register("type")}
            error={errors.type?.message}
          />
          <Input
            label="Requested on"
            type="date"
            required
            min={MIN_RECORD_DATE}
            max={TODAY_ISO}
            {...register("requestedOn")}
            error={errors.requestedOn?.message}
          />
          <Select
            label="Status"
            required
            options={STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="TC number"
            required
            hint="Auto-assigned when issued — leave as —"
            {...register("tcNo")}
            error={errors.tcNo?.message}
          />
          <Input
            label="Issued on"
            required
            hint="Auto-assigned when issued — leave as —"
            {...register("issuedOn")}
            error={errors.issuedOn?.message}
          />
          <Input
            label="Pending dues (₹)"
            type="number"
            min={0}
            {...register("dues")}
            error={errors.dues?.message}
          />
        </div>

        <Textarea
          label="Reason"
          required
          placeholder="Why is the student leaving?"
          {...register("reason")}
          error={errors.reason?.message}
        />

        {statusValue === "issued" && (
          <p className="rounded-md bg-info-soft/50 px-3 py-2 text-xs text-info-text">
            Issuing this certificate assigns a TC number &amp; date automatically and marks the student as{" "}
            <span className="font-semibold">{typeValue === "withdrawal" ? "withdrawn (inactive)" : "transferred"}</span>,
            removing them from active rosters, promotions and fee runs.
          </p>
        )}

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
