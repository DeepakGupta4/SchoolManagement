"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { Modal, Button, Input, Select, Textarea, useToast } from "@/components/ui";
import { PhotoFrame } from "@/components/cards/PhotoFrame";
import { fileToDataUrl } from "@/lib/image";
import { staffSchema, type StaffSchema } from "@/lib/schemas/staff";
import { digitsOnly10 } from "@/lib/phone";
import { nextCodeId } from "@/lib/autoId";
import { MIN_ADULT_DOB, MAX_ADULT_DOB, TODAY_ISO } from "@/lib/dates";
import { AttachmentsField } from "@/components/AttachmentsField";
import { uploadDocumentFiles } from "@/lib/api/documents";
import {
  STAFF_DEPT_OPTIONS,
  STAFF_TYPE_OPTIONS,
  STAFF_STATUS_OPTIONS,
  type StaffMember,
} from "@/lib/api/staff";

// Common non-teaching roles — offered as a quick pick, but the field stays free
// text so any custom role works.
const STAFF_ROLE_PRESETS = [
  "Receptionist", "Accountant", "Office Assistant", "Clerk",
  "Librarian", "Lab Assistant", "IT Support", "System Administrator",
  "Security Guard", "Bus Driver", "Bus Conductor", "Peon",
  "Housekeeping", "Gardener", "Nurse", "Counsellor", "Cook",
];

// Common support-staff qualifications — a quick pick, still free text.
const STAFF_QUALIFICATION_PRESETS = [
  "10th", "12th", "ITI", "Diploma",
  "B.A", "B.Com", "B.Sc", "M.A", "M.Com",
  "BCA", "MCA", "B.Lib", "M.Lib", "GNM", "D.Pharm",
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const emptyValues: StaffSchema = {
  employeeId: "",
  name: "",
  role: "",
  dept: STAFF_DEPT_OPTIONS[0],
  type: STAFF_TYPE_OPTIONS[0],
  status: "active",
  gender: "",
  dateOfBirth: "",
  qualification: "",
  experienceYears: 0,
  phone: "",
  email: "",
  address: "",
  join: "",
  salary: 0,
  avatar: "",
};

interface StaffFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: StaffMember | null;
  /** Existing staff — used to block a duplicate email. */
  existing?: StaffMember[];
  saving?: boolean;
  /** Returns the saved staff member (so attachments can be uploaded), or null on error. */
  onSubmit: (values: StaffSchema) => Promise<StaffMember | null | void>;
}

export function StaffFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: StaffFormModalProps) {
  const isEdit = Boolean(record);

  const { toast } = useToast();
  // Files attached in the form, uploaded once the staff record has an id.
  const [attachments, setAttachments] = useState<File[]>([]);
  const [savingDocs, setSavingDocs] = useState(false);
  const [dupError, setDupError] = useState<string | null>(null);
  const [empIdError, setEmpIdError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<StaffSchema>({
    resolver: zodResolver(staffSchema),
    defaultValues: emptyValues,
  });

  // useWatch (not watch) so the React Compiler can still optimise this component.
  const avatar = useWatch({ control, name: "avatar" });
  const name = useWatch({ control, name: "name" });

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setValue("avatar", dataUrl, { shouldDirty: true });
    } catch (e) {
      toast({
        title: "Could not add photo",
        description: e instanceof Error ? e.message : "Please try another image.",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttachments([]);
    // Deferred: clearing the duplicate errors synchronously in an effect trips
    // the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => {
      setDupError(null);
      setEmpIdError(null);
    }, 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Auto employee ID on create (editable), once existing staff are known.
  useEffect(() => {
    if (!open || isEdit) return;
    setValue("employeeId", nextCodeId("STF", existing.map((s) => s.employeeId)));
  }, [open, isEdit, existing, setValue]);

  // Case-insensitive sets of emails + employee IDs already taken by *other* staff.
  const { takenEmails, takenEmployeeIds } = useMemo(() => {
    const emails = new Set<string>();
    const ids = new Set<string>();
    for (const s of existing) {
      if (record && s.id === record.id) continue;
      if (s.email) emails.add(s.email.trim().toLowerCase());
      if (s.employeeId) ids.add(s.employeeId.trim().toLowerCase());
    }
    return { takenEmails: emails, takenEmployeeIds: ids };
  }, [existing, record]);

  const submit = handleSubmit(async (values) => {
    const email = values.email.trim();
    const employeeId = values.employeeId.trim();
    if (takenEmployeeIds.has(employeeId.toLowerCase())) {
      setEmpIdError(`Employee ID "${employeeId}" is already in use.`);
      return;
    }
    if (takenEmails.has(email.toLowerCase())) {
      setDupError(`A staff member with the email "${email}" already exists.`);
      return;
    }
    setDupError(null);
    setEmpIdError(null);
    const saved = await onSubmit({ ...values, email, employeeId });
    if (!saved) return; // save failed — keep the form open (error already shown)
    if (attachments.length > 0) {
      setSavingDocs(true);
      const { uploaded, failed } = await uploadDocumentFiles("staff", saved.id, saved.name, attachments);
      setSavingDocs(false);
      if (failed) {
        toast({
          title: `${uploaded} uploaded, ${failed} failed`,
          description: "Some attachments could not be saved.",
          variant: "warning",
        });
      }
    }
    onOpenChange(false);
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit staff member" : "Add staff member"}
      description={
        isEdit
          ? "Update this staff record. Changes apply immediately."
          : "Create a staff record. The employee ID must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || savingDocs}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || savingDocs}>
            {savingDocs ? "Uploading…" : saving ? "Saving…" : isEdit ? "Save changes" : "Add staff"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Passport photo — shows on the staff ID card. */}
        <div className="flex items-center gap-4">
          <PhotoFrame src={avatar || undefined} name={name || "Staff"} className="w-16 shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <label className="focus-within:outline-none">
                <span className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-hover">
                  <Upload className="size-4" />
                  {uploading ? "Processing…" : avatar ? "Change photo" : "Upload photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    handlePhoto(e.target.files?.[0]);
                    e.target.value = ""; // allow re-selecting the same file
                  }}
                />
              </label>
              {avatar && (
                <Button type="button" variant="ghost" onClick={() => setValue("avatar", "", { shouldDirty: true })}>
                  <X className="size-4" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-subtle">Passport-style photo. Appears on the ID card. Resized automatically.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Employee ID" required hint={!isEdit ? "Auto-generated — editable" : undefined} placeholder="STF013" {...register("employeeId", { onChange: () => setEmpIdError(null) })} error={errors.employeeId?.message ?? empIdError ?? undefined} />
          <Input label="Full name" required placeholder="Ms. Anita Gupta" {...register("name")} error={errors.name?.message} />

          {/* Role — pick a preset or type a custom one. */}
          <Input label="Role" required list="staff-roles" placeholder="Pick or type — e.g. Receptionist" {...register("role")} error={errors.role?.message} />
          <datalist id="staff-roles">
            {STAFF_ROLE_PRESETS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>

          {/* Department — pick a preset or type a custom one. */}
          <Input label="Department" required list="staff-depts" placeholder="Pick or type — e.g. Administration" {...register("dept")} error={errors.dept?.message} />
          <datalist id="staff-depts">
            {STAFF_DEPT_OPTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          <Select label="Gender" required placeholder="Select gender" options={GENDER_OPTIONS} {...register("gender")} error={errors.gender?.message} />
          <Input label="Date of birth" type="date" min={MIN_ADULT_DOB} max={MAX_ADULT_DOB} {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />

          {/* Qualification — pick a preset or type a custom one. */}
          <Input label="Qualification" required list="staff-qualifications" placeholder="Pick or type — e.g. B.Com / Diploma / 12th" {...register("qualification")} error={errors.qualification?.message} />
          <datalist id="staff-qualifications">
            {STAFF_QUALIFICATION_PRESETS.map((q) => (
              <option key={q} value={q} />
            ))}
          </datalist>

          <Input label="Experience (years)" type="number" min={0} {...register("experienceYears")} error={errors.experienceYears?.message} />
          <Select label="Employment type" required options={STAFF_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))} {...register("type")} error={errors.type?.message} />
          <Select label="Status" required options={STAFF_STATUS_OPTIONS} {...register("status")} error={errors.status?.message} />
          <Input label="Phone" required inputMode="numeric" maxLength={10} placeholder="9876543210" {...register("phone", { onChange: digitsOnly10 })} error={errors.phone?.message} />
          <Input label="Email" required type="email" placeholder="name@school.edu" {...register("email")} error={errors.email?.message ?? dupError ?? undefined} />
          <Input label="Join date" required type="date" max={TODAY_ISO} {...register("join")} error={errors.join?.message} />
          <Input label="Monthly salary (₹)" type="number" min={0} {...register("salary")} error={errors.salary?.message} />
        </div>

        <Textarea label="Address" placeholder="Residential address" {...register("address")} error={errors.address?.message} />


        <div>
          <p className="mb-3 mt-1 text-xs font-semibold uppercase tracking-wide text-subtle">Documents</p>
          <AttachmentsField
            files={attachments}
            onChange={setAttachments}
            hint="Optional — ID proofs, contracts, certificates. You can also add these later from the profile."
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
