"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Modal, Button, Input, Select } from "@/components/ui";
import { Field, controlClasses } from "@/components/ui/Input";
import { certificateSchema, type CertificateSchema } from "@/lib/schemas/certificate";
import {
  CERTIFICATE_STATUS_OPTIONS,
  CERTIFICATE_TYPE_OPTIONS,
  CURRENT_SESSION,
  todayIso,
  type Certificate,
} from "@/lib/api/certificates";
import { listStudents } from "@/lib/api/students";
import { useClassOptions } from "@/hooks/useClassOptions";
import { fullName, type Student } from "@/types/student";
import { MAX_STUDENT_DOB, MIN_RECORD_DATE, MIN_STUDENT_DOB, TODAY_ISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

const emptyValues: CertificateSchema = {
  student: "",
  admissionNo: "",
  className: "",
  section: "",
  rollNo: "",
  studentId: "",
  fatherName: "",
  dob: "",
  session: CURRENT_SESSION,
  type: "Bonafide",
  requestedBy: "",
  requestedOn: todayIso(),
  status: "pending",
};

interface CertificateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Certificate | null;
  saving?: boolean;
  onSubmit: (values: CertificateSchema) => Promise<void>;
}

export function CertificateFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: CertificateFormModalProps) {
  const isEdit = Boolean(record);
  const { classOptions } = useClassOptions();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CertificateSchema>({
    resolver: zodResolver(certificateSchema),
    defaultValues: emptyValues,
  });

  // Roster for the student autocomplete, loaded once per open in create mode.
  const [roster, setRoster] = useState<Student[]>([]);
  const [focused, setFocused] = useState(false);
  // In edit mode there's nothing to look up, so the dropdown stays closed until
  // the operator actively edits the name.
  const [picked, setPicked] = useState(true);

  const nameValue = useWatch({ control, name: "student" });
  const classValue = useWatch({ control, name: "className" });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? {
            student: record.student,
            admissionNo: record.admissionNo,
            className: record.className,
            section: record.section ?? "",
            rollNo: record.rollNo ?? "",
            studentId: record.studentId ?? "",
            fatherName: record.fatherName ?? "",
            dob: record.dob ?? "",
            session: record.session || CURRENT_SESSION,
            type: record.type,
            requestedBy: record.requestedBy,
            requestedOn: record.requestedOn,
            status: record.status,
          }
        : { ...emptyValues, requestedOn: todayIso(), session: CURRENT_SESSION }
    );
    // Deferred so the reset paints before the dropdown state is cleared.
    const t = setTimeout(() => {
      setPicked(true);
      setFocused(false);
    }, 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Real students power the picker, so a certificate is populated from actual
  // records rather than typed-in placeholders.
  useEffect(() => {
    if (!open || isEdit) return;
    let cancelled = false;
    listStudents()
      .then((all) => !cancelled && setRoster(all.filter((s) => s.status === "active")))
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

  /** Fill every particular from the chosen student in one go. */
  const pick = (s: Student) => {
    setValue("student", fullName(s), { shouldValidate: true });
    setValue("admissionNo", s.admissionNo, { shouldValidate: true });
    setValue("className", s.className, { shouldValidate: true });
    setValue("section", s.section);
    setValue("rollNo", s.rollNo);
    setValue("studentId", s.id);
    setValue("fatherName", s.guardian?.name ?? "");
    setValue("dob", s.dateOfBirth ?? "");
    setPicked(true);
  };

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit certificate request" : "New certificate request"}
      description={
        isEdit
          ? "Update this request. Marking it issued stamps today's date and a verification code."
          : "Pick the class, then type the student's name to auto-fill their details. A QR verification code is generated once it is issued."
      }
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
            <Field label="Student name" required error={errors.student?.message}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                <input
                  autoComplete="off"
                  placeholder={isEdit ? "Aarav Sharma" : "Type to search students…"}
                  className={cn(controlClasses, "pl-9", errors.student && "border-danger")}
                  {...register("student", {
                    onChange: () => {
                      setPicked(false);
                      // Typing invalidates a previously auto-filled admission no.
                      if (!isEdit) setValue("admissionNo", "");
                    },
                  })}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </div>
            </Field>

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
                        pick(s);
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

          <Input
            label="Admission number"
            required
            placeholder="ADM/2019/0412"
            hint={!isEdit ? "Auto-filled from the selected student" : undefined}
            {...register("admissionNo")}
            error={errors.admissionNo?.message}
          />
          <Input
            label="Section"
            placeholder="A"
            {...register("section")}
            error={errors.section?.message}
          />
          <Input
            label="Roll number"
            placeholder="12"
            {...register("rollNo")}
            error={errors.rollNo?.message}
          />
          <Input
            label="Guardian name"
            placeholder="Sunita Deshpande"
            hint="Shown as 'Ward of …' on the certificate"
            {...register("fatherName")}
            error={errors.fatherName?.message}
          />
          <Input
            label="Date of birth"
            type="date"
            min={MIN_STUDENT_DOB}
            max={MAX_STUDENT_DOB}
            {...register("dob")}
            error={errors.dob?.message}
          />
          <Select
            label="Certificate type"
            required
            options={CERTIFICATE_TYPE_OPTIONS}
            {...register("type")}
            error={errors.type?.message}
          />
          <Input
            label="Academic session"
            required
            placeholder="2025-26"
            {...register("session")}
            error={errors.session?.message}
          />
          <Input
            label="Requested by"
            required
            placeholder="Sunita Deshpande (Mother)"
            {...register("requestedBy")}
            error={errors.requestedBy?.message}
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
            options={CERTIFICATE_STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
