"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { Modal, Button, Input, Textarea, Select, useToast } from "@/components/ui";
import { PhotoFrame } from "@/components/cards/PhotoFrame";
import { studentSchema, type StudentSchema } from "@/lib/schemas/student";
import { digitsOnly10, PHONE_REGEX } from "@/lib/phone";
import { listStudents } from "@/lib/api/students";
import { useClassOptions } from "@/hooks/useClassOptions";
import { fileToDataUrl } from "@/lib/image";
import { AttachmentsField } from "@/components/AttachmentsField";
import { SingleDocField } from "@/components/SingleDocField";
import { uploadDocumentFiles, uploadLabeledDocument } from "@/lib/api/documents";
import { feeStructuresApi, feeTotal, FEE_HEADS, type FeeStructure } from "@/lib/api/feeStructures";
import { createFeeAccount } from "@/lib/api/feeLedger";
import { MIN_STUDENT_DOB, MAX_STUDENT_DOB, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";
import type { Student, StudentFormValues } from "@/types/student";

/** Next school-wide admission number, e.g. ADM-2026-0007, unique vs. existing. */
function nextAdmissionNo(students: Student[]): string {
  const year = new Date().getFullYear();
  const used = new Set(students.map((s) => s.admissionNo));
  let max = 0;
  for (const s of students) {
    const m = String(s.admissionNo).match(/(\d+)\s*$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  let n = Math.max(max, students.length) + 1;
  let candidate = `ADM-${year}-${String(n).padStart(4, "0")}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `ADM-${year}-${String(n).padStart(4, "0")}`;
  }
  return candidate;
}

/** Next roll number within a class + section (sequential per class). */
function nextRollNo(students: Student[], className: string, section: string): number {
  let max = 0;
  for (const s of students) {
    if (s.className !== className || s.section !== section) continue;
    const n = parseInt(String(s.rollNo).replace(/\D/g, ""), 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return max + 1;
}

type FeeMode = "none" | "structure" | "custom";

/**
 * The billed fee heads to open the account with — either every non-zero head of
 * the chosen structure, or a single "Tuition Fee" head for a lump-sum total.
 * The concession is applied server-side, so heads here are the gross amounts.
 */
function buildFeeHeads(mode: FeeMode, structure: FeeStructure | null, total: number) {
  if (mode === "structure" && structure) {
    return FEE_HEADS.map((h) => ({ head: h.label, billed: Number(structure[h.key]) || 0 })).filter(
      (h) => h.billed > 0
    );
  }
  if (mode === "custom" && total > 0) {
    return [{ head: "Tuition Fee", billed: Math.round(total) }];
  }
  return [];
}

const toOptions = (values: readonly string[]) =>
  values.map((v) => ({ label: v, value: v }));

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Alumni", value: "alumni" },
  { label: "Transferred", value: "transferred" },
];

const BLOOD_OPTIONS = toOptions(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);

const CATEGORY_OPTIONS = toOptions(["General", "OBC", "SC", "ST", "Other"]);

// Datalist suggestions — pick or type, so forms stay low-typing but flexible.
const NATIONALITY_SUGGESTIONS = ["Indian", "Nepali", "Bhutanese", "Bangladeshi", "Other"];
const RELIGION_SUGGESTIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi", "Jewish", "Other"];
const OCCUPATION_SUGGESTIONS = [
  "Business", "Service / Job", "Government Service", "Private Service", "Self-employed",
  "Farmer", "Teacher", "Doctor", "Engineer", "Lawyer", "Accountant", "Shopkeeper",
  "Driver", "Labourer", "Homemaker", "Retired", "Other",
];

const emptyValues: StudentSchema = {
  admissionNo: "",
  rollNo: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "male",
  bloodGroup: undefined,
  className: "",
  section: "",
  status: "active",
  admissionDate: TODAY_ISO,
  address: "",
  guardian: { name: "", relation: "Father", phone: "", email: "", occupation: "" },
  medicalNotes: "",
  avatar: "",
  // Optional admission-form details.
  fatherName: "",
  fatherOccupation: "",
  fatherPhone: "",
  fatherEmail: "",
  motherName: "",
  motherOccupation: "",
  motherPhone: "",
  motherEmail: "",
  nationality: "Indian",
  religion: "",
  category: "",
  motherTongue: "",
  aadhaarNo: "",
  placeOfBirth: "",
  annualIncome: "",
  correspondenceAddress: "",
  emergencyContact: "",
  previousSchool: "",
  previousClass: "",
  previousBoard: "",
  tcNumber: "",
  previousResult: "",
  transportRequired: false,
  pickupPoint: "",
};

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  student?: Student | null;
  /** Returns the saved student (so attachments can be uploaded), or null on error. */
  onSubmit: (values: StudentFormValues) => Promise<Student | null | void>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-1 text-xs font-semibold uppercase tracking-wide text-subtle">
      {children}
    </p>
  );
}

export function StudentFormModal({
  open,
  onOpenChange,
  student,
  onSubmit,
}: StudentFormModalProps) {
  const isEdit = Boolean(student);

  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  // Files attached in the form, uploaded once the student record has an id.
  const [attachments, setAttachments] = useState<File[]>([]);
  // Required documents on create: a birth certificate and a government ID.
  const [birthCert, setBirthCert] = useState<File | null>(null);
  const [aadhaar, setAadhaar] = useState<File | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [savingDocs, setSavingDocs] = useState(false);
  // Who the school's primary contact is — drives the saved guardian record, so
  // we never ask for "guardian" and "father" as two separate things.
  const [primaryContact, setPrimaryContact] = useState<"father" | "mother" | "other">("father");
  const [contactError, setContactError] = useState<string | null>(null);
  // Existing students, used to auto-derive the next admission & roll numbers.
  const [existing, setExisting] = useState<Student[]>([]);
  // Optional fees, set during admission (create mode only). "none" skips it.
  const [feeMode, setFeeMode] = useState<FeeMode>("none");
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeStructureId, setFeeStructureId] = useState("");
  const [feeTotalInput, setFeeTotalInput] = useState("");
  const [feeConcession, setFeeConcession] = useState("");
  // Classes/sections come from the Classes & Sections module — a single source
  // of truth, so a class added there shows up here automatically.
  const { classOptions, sectionOptions } = useClassOptions();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: emptyValues,
  });

  // useWatch (not watch) so the React Compiler can still optimise this component.
  const avatar = useWatch({ control, name: "avatar" });
  const firstName = useWatch({ control, name: "firstName" });
  const lastName = useWatch({ control, name: "lastName" });
  const className = useWatch({ control, name: "className" });
  const section = useWatch({ control, name: "section" });

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

  // Repopulate whenever the modal opens or the target student changes,
  // otherwise the previous student's values leak into the next open.
  useEffect(() => {
    if (!open) return;
    reset(
      student
        ? {
            ...student,
            guardian: { ...student.guardian, email: student.guardian.email ?? "", occupation: student.guardian.occupation ?? "" },
            medicalNotes: student.medicalNotes ?? "",
            // Coalesce optional admission-form fields so inputs stay controlled
            // even for older records saved before these fields existed.
            fatherName: student.fatherName ?? "",
            fatherOccupation: student.fatherOccupation ?? "",
            fatherPhone: student.fatherPhone ?? "",
            fatherEmail: student.fatherEmail ?? "",
            motherName: student.motherName ?? "",
            motherOccupation: student.motherOccupation ?? "",
            motherPhone: student.motherPhone ?? "",
            motherEmail: student.motherEmail ?? "",
            nationality: student.nationality || "Indian",
            religion: student.religion ?? "",
            category: student.category ?? "",
            motherTongue: student.motherTongue ?? "",
            aadhaarNo: student.aadhaarNo ?? "",
            placeOfBirth: student.placeOfBirth ?? "",
            annualIncome: student.annualIncome ?? "",
            correspondenceAddress: student.correspondenceAddress ?? "",
            emergencyContact: student.emergencyContact ?? "",
            previousSchool: student.previousSchool ?? "",
            previousClass: student.previousClass ?? "",
            previousBoard: student.previousBoard ?? "",
            tcNumber: student.tcNumber ?? "",
            previousResult: student.previousResult ?? "",
            transportRequired: student.transportRequired ?? false,
            pickupPoint: student.pickupPoint ?? "",
          }
        : emptyValues
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttachments([]);
    // Deferred: clearing these synchronously in an effect trips the
    // react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => {
      setDocError(null);
      setContactError(null);
      // Edit: keep the saved guardian visible (Other) so nothing is lost.
      // Create: default the main contact to Father.
      setPrimaryContact(student ? "other" : "father");
      setBirthCert(null);
      setAadhaar(null);
      setFeeMode("none");
      setFeeStructureId("");
      setFeeTotalInput("");
      setFeeConcession("");
    }, 0);
    return () => clearTimeout(t);
  }, [open, student, reset]);

  // On create, pull the roster once so the next admission & roll numbers can
  // be derived. Skipped in edit mode — those numbers are fixed on a record.
  useEffect(() => {
    if (!open || isEdit) return;
    let cancelled = false;
    listStudents()
      .then((all) => !cancelled && setExisting(all))
      .catch(() => !cancelled && setExisting([]));
    return () => {
      cancelled = true;
    };
  }, [open, isEdit]);

  // Fee structures for the optional "set fees now" section (create mode only).
  useEffect(() => {
    if (!open || isEdit) return;
    let cancelled = false;
    feeStructuresApi
      .list()
      .then((all) => !cancelled && setFeeStructures(all))
      .catch(() => !cancelled && setFeeStructures([]));
    return () => {
      cancelled = true;
    };
  }, [open, isEdit]);

  // Auto admission number (school-wide) once the roster is known.
  useEffect(() => {
    if (!open || isEdit) return;
    setValue("admissionNo", nextAdmissionNo(existing));
  }, [open, isEdit, existing, setValue]);

  // Auto roll number, recomputed whenever the class or section changes.
  useEffect(() => {
    if (!open || isEdit || !className || !section) return;
    setValue("rollNo", String(nextRollNo(existing, className, section)));
  }, [open, isEdit, existing, className, section, setValue]);

  // Fee structures for the class picked above, and the derived amounts shown in
  // the Fees section. Cheap to recompute; the React Compiler memoises it.
  const classStructures = feeStructures.filter((s) => s.class === className);
  const selectedStructure = classStructures.find((s) => s.id === feeStructureId) ?? null;
  const feeGross =
    feeMode === "structure"
      ? selectedStructure
        ? feeTotal(selectedStructure)
        : 0
      : feeMode === "custom"
        ? Number(feeTotalInput) || 0
        : 0;
  const feeConcessionNum = Math.min(Number(feeConcession) || 0, feeGross);
  const feeNet = Math.max(0, feeGross - feeConcessionNum);

  const submit = handleSubmit(async (values) => {
    // On create, a birth certificate and a government ID are mandatory.
    if (!isEdit && (!birthCert || !aadhaar)) {
      setDocError("Attach the birth certificate and the student's Aadhaar / government ID.");
      return;
    }
    setDocError(null);

    // Derive the saved guardian from the chosen primary contact, so the school
    // stores one contact — not "guardian" and "father" as duplicate people.
    const pick = {
      father: { name: values.fatherName, relation: "Father", phone: values.fatherPhone, email: values.fatherEmail, occupation: values.fatherOccupation },
      mother: { name: values.motherName, relation: "Mother", phone: values.motherPhone, email: values.motherEmail, occupation: values.motherOccupation },
      other: { name: values.guardian?.name, relation: values.guardian?.relation || "Guardian", phone: values.guardian?.phone, email: values.guardian?.email, occupation: values.guardian?.occupation },
    }[primaryContact];
    const gName = (pick.name || "").trim();
    const gPhone = (pick.phone || "").trim();
    if (gName.length < 2 || !PHONE_REGEX.test(gPhone)) {
      setContactError(
        primaryContact === "other"
          ? "Enter the guardian's name and a 10-digit phone number."
          : `Enter the ${primaryContact}'s name and a 10-digit phone number — it's the primary contact.`
      );
      return;
    }
    setContactError(null);

    const finalValues = {
      ...values,
      guardian: { name: gName, relation: pick.relation || "Guardian", phone: gPhone, email: pick.email || "", occupation: pick.occupation || "" },
    };

    const saved = await onSubmit(finalValues as StudentFormValues);
    if (!saved) return; // save failed — keep the form open (error already shown)

    setSavingDocs(true);
    const name = `${values.firstName} ${values.lastName}`.trim();
    let failed = 0;
    if (birthCert && !(await uploadLabeledDocument("student", saved.id, name, "Birth certificate", birthCert))) failed += 1;
    if (aadhaar && !(await uploadLabeledDocument("student", saved.id, name, "Aadhaar / Government ID", aadhaar))) failed += 1;
    if (attachments.length > 0) {
      const r = await uploadDocumentFiles("student", saved.id, name, attachments);
      failed += r.failed;
    }

    // Optional: open a fee account so the student's dues show on their profile
    // and across the Fees pages. Non-fatal — admission still succeeds without it.
    if (!isEdit && feeMode !== "none") {
      const heads = buildFeeHeads(feeMode, selectedStructure, Number(feeTotalInput) || 0);
      if (heads.length > 0) {
        try {
          await createFeeAccount({
            studentId: saved.id,
            heads,
            concession: Number(feeConcession) || 0,
          });
        } catch {
          toast({
            title: "Fees not set up",
            description:
              "The student was created, but their fee account couldn't be opened. You can add it from the Fees page.",
            variant: "warning",
          });
        }
      }
    }

    setSavingDocs(false);
    if (failed) {
      toast({
        title: "Some documents could not be saved",
        description: `${failed} file(s) failed to upload. You can re-add them from the profile.`,
        variant: "warning",
      });
    }
    onOpenChange(false);
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit student" : "Add new student"}
      description={
        isEdit
          ? "Update this student's record. Changes apply immediately."
          : "Create a student record. A birth certificate and a government ID are required."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || savingDocs}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting || savingDocs}>
            {savingDocs ? "Uploading…" : isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create student"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <section>
          <SectionTitle>Photo</SectionTitle>
          <div className="flex items-center gap-4">
            <PhotoFrame
              src={avatar || undefined}
              name={`${firstName} ${lastName}`.trim() || "Student"}
              className="w-16 shrink-0"
            />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <label className="focus-within:outline-none">
                  <span className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-hover hover:border-border-strong">
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setValue("avatar", "", { shouldDirty: true })}
                  >
                    <X className="size-4" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-subtle">
                Passport-style photo. Appears on the profile and the ID card. Resized automatically.
              </p>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Identity</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" required {...register("firstName")} error={errors.firstName?.message} />
            <Input label="Last name" required {...register("lastName")} error={errors.lastName?.message} />
            <Input label="Admission no." required hint={!isEdit ? "Auto-generated — editable" : undefined} {...register("admissionNo")} error={errors.admissionNo?.message} />
            <Input label="Roll no." required hint={!isEdit ? "Auto, class-wise — editable" : undefined} {...register("rollNo")} error={errors.rollNo?.message} />
            <Input label="Date of birth" type="date" required min={MIN_STUDENT_DOB} max={MAX_STUDENT_DOB} {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />
            <Select label="Gender" required options={GENDER_OPTIONS} {...register("gender")} error={errors.gender?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Contact</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" required {...register("email")} error={errors.email?.message} />
            <Input label="Phone" required hint="10-digit mobile number" inputMode="numeric" maxLength={10} placeholder="9876543210" {...register("phone", { onChange: digitsOnly10 })} error={errors.phone?.message} />
          </div>
          <div className="mt-4">
            <Textarea label="Address" required {...register("address")} error={errors.address?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Academics</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Class" required placeholder="Select class" options={classOptions} {...register("className")} error={errors.className?.message} />
            <Select label="Section" required placeholder="Select section" options={sectionOptions} {...register("section")} error={errors.section?.message} />
            <Input label="Admission date" type="date" required min={MIN_RECORD_DATE} max={TODAY_ISO} {...register("admissionDate")} error={errors.admissionDate?.message} />
            <Select label="Status" required options={STATUS_OPTIONS} {...register("status")} error={errors.status?.message} />
          </div>
          {classOptions.length === 0 && (
            <p className="mt-3 rounded-md bg-warning-soft/50 px-3 py-2 text-xs text-warning-text">
              No classes yet — create a class in <span className="font-semibold">Classes &amp; Sections</span> first, then pick it here.
            </p>
          )}
        </section>

        <section>
          <SectionTitle>Medical</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Blood group" placeholder="Not recorded" options={BLOOD_OPTIONS} {...register("bloodGroup", { setValueAs: (v) => v || undefined })} error={errors.bloodGroup?.message} />
          </div>
          <div className="mt-4">
            <Textarea label="Medical notes" hint="Allergies, conditions, medication" {...register("medicalNotes")} error={errors.medicalNotes?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Parent / Guardian Details</SectionTitle>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">Father</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Father's name" {...register("fatherName")} error={errors.fatherName?.message} />
            <Input label="Father's occupation" list="occupation-list" placeholder="Pick or type" {...register("fatherOccupation")} error={errors.fatherOccupation?.message} />
            <Input label="Father's phone" inputMode="numeric" maxLength={10} placeholder="9876543210" {...register("fatherPhone", { onChange: digitsOnly10 })} error={errors.fatherPhone?.message} />
            <Input label="Father's email" type="email" {...register("fatherEmail")} error={errors.fatherEmail?.message} />
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-subtle">Mother</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Mother's name" {...register("motherName")} error={errors.motherName?.message} />
            <Input label="Mother's occupation" list="occupation-list" placeholder="Pick or type" {...register("motherOccupation")} error={errors.motherOccupation?.message} />
            <datalist id="occupation-list">{OCCUPATION_SUGGESTIONS.map((o) => <option key={o} value={o} />)}</datalist>
            <Input label="Mother's phone" inputMode="numeric" maxLength={10} placeholder="9876543210" {...register("motherPhone", { onChange: digitsOnly10 })} error={errors.motherPhone?.message} />
            <Input label="Mother's email" type="email" {...register("motherEmail")} error={errors.motherEmail?.message} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Primary contact"
              required
              hint="Whose number receives school updates &amp; is saved as the guardian"
              value={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.value as "father" | "mother" | "other")}
              options={[
                { label: "Father", value: "father" },
                { label: "Mother", value: "mother" },
                { label: "Other guardian", value: "other" },
              ]}
            />
          </div>

          {primaryContact === "other" && (
            <div className="mt-3 grid grid-cols-1 gap-4 rounded-md border border-border bg-surface-sunken p-3 sm:grid-cols-2">
              <Input label="Guardian name" required {...register("guardian.name")} error={errors.guardian?.name?.message} />
              <Input label="Relation" required placeholder="e.g. Uncle, Grandfather" {...register("guardian.relation")} error={errors.guardian?.relation?.message} />
              <Input label="Guardian phone" required inputMode="numeric" maxLength={10} placeholder="9876543210" {...register("guardian.phone", { onChange: digitsOnly10 })} error={errors.guardian?.phone?.message} />
              <Input label="Guardian email" type="email" {...register("guardian.email")} error={errors.guardian?.email?.message} />
              <Input label="Guardian occupation" {...register("guardian.occupation")} error={errors.guardian?.occupation?.message} />
            </div>
          )}

          {contactError && <p className="mt-2 text-xs text-danger">{contactError}</p>}
        </section>

        <section>
          <SectionTitle>Other Particulars (optional)</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nationality" list="nationality-list" hint="Defaults to Indian — change if needed" {...register("nationality")} error={errors.nationality?.message} />
            <datalist id="nationality-list">{NATIONALITY_SUGGESTIONS.map((n) => <option key={n} value={n} />)}</datalist>
            <Input label="Religion" list="religion-list" placeholder="Pick or type" {...register("religion")} error={errors.religion?.message} />
            <datalist id="religion-list">{RELIGION_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
            <Select label="Category" placeholder="Select category" options={CATEGORY_OPTIONS} {...register("category")} error={errors.category?.message} />
            <Input label="Mother tongue" {...register("motherTongue")} error={errors.motherTongue?.message} />
            <Input
              label="Aadhaar no."
              inputMode="numeric"
              maxLength={12}
              placeholder="12-digit number"
              {...register("aadhaarNo", { onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 12); } })}
              error={errors.aadhaarNo?.message}
            />
            <Input label="Place of birth" {...register("placeOfBirth")} error={errors.placeOfBirth?.message} />
            <Input label="Annual income (₹)" inputMode="numeric" placeholder="e.g. 500000" {...register("annualIncome")} error={errors.annualIncome?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Previous School (optional)</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Last school attended" {...register("previousSchool")} error={errors.previousSchool?.message} />
            <Input label="Class passed" {...register("previousClass")} error={errors.previousClass?.message} />
            <Input label="Board" placeholder="e.g. CBSE" {...register("previousBoard")} error={errors.previousBoard?.message} />
            <Input label="T.C. number" {...register("tcNumber")} error={errors.tcNumber?.message} />
            <Input label="Result / %" {...register("previousResult")} error={errors.previousResult?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Transport &amp; Emergency (optional)</SectionTitle>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              {...register("transportRequired")}
              className="focus-ring size-4 cursor-pointer rounded-sm accent-primary"
            />
            <span className="text-sm text-text">Transport required</span>
          </label>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Pick-up point / route" {...register("pickupPoint")} error={errors.pickupPoint?.message} />
            <Input label="Emergency contact" hint="Name &amp; phone" {...register("emergencyContact")} error={errors.emergencyContact?.message} />
          </div>
          <div className="mt-4">
            <Textarea label="Correspondence address" hint="If different from the address above" {...register("correspondenceAddress")} error={errors.correspondenceAddress?.message} />
          </div>
        </section>

        {!isEdit && (
          <section>
            <SectionTitle>Fees (optional)</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Set up fees now"
                value={feeMode}
                onChange={(e) => setFeeMode(e.target.value as FeeMode)}
                options={[
                  { label: "Skip for now", value: "none" },
                  { label: "Use a fee structure", value: "structure" },
                  { label: "Enter a total fee", value: "custom" },
                ]}
              />
              {feeMode === "structure" && (
                <Select
                  label="Fee structure"
                  placeholder={className ? "Select a structure" : "Pick a class first"}
                  value={feeStructureId}
                  onChange={(e) => setFeeStructureId(e.target.value)}
                  options={classStructures.map((s) => ({
                    label: `${s.code} — ₹${feeTotal(s).toLocaleString("en-IN")}`,
                    value: s.id,
                  }))}
                />
              )}
              {feeMode === "custom" && (
                <Input
                  label="Total annual fee (₹)"
                  inputMode="numeric"
                  placeholder="e.g. 45000"
                  value={feeTotalInput}
                  onChange={(e) => setFeeTotalInput(e.target.value.replace(/[^\d]/g, ""))}
                />
              )}
              {feeMode !== "none" && (
                <Input
                  label="Concession / discount (₹)"
                  hint="Optional — scholarship or sibling discount"
                  inputMode="numeric"
                  placeholder="0"
                  value={feeConcession}
                  onChange={(e) => setFeeConcession(e.target.value.replace(/[^\d]/g, ""))}
                />
              )}
            </div>
            {feeMode === "structure" && className && classStructures.length === 0 && (
              <p className="mt-3 rounded-md bg-warning-soft/50 px-3 py-2 text-xs text-warning-text">
                No fee structure for <span className="font-semibold">{className}</span> yet — create one
                in <span className="font-semibold">Fees &rarr; Fee Structure</span>, or enter a total fee
                instead.
              </p>
            )}
            {feeMode !== "none" && feeGross > 0 && (
              <p className="mt-3 text-xs text-muted">
                Billed <span className="font-medium text-text">₹{feeGross.toLocaleString("en-IN")}</span>
                {feeConcessionNum > 0 && (
                  <>
                    {" · concession "}
                    <span className="font-medium text-success-text">
                      ₹{feeConcessionNum.toLocaleString("en-IN")}
                    </span>
                  </>
                )}
                {" · payable "}
                <span className="font-medium text-text">₹{feeNet.toLocaleString("en-IN")}</span>
              </p>
            )}
          </section>
        )}

        <section>
          <SectionTitle>Documents{!isEdit ? " (required)" : ""}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SingleDocField
              label="Birth certificate"
              required={!isEdit}
              file={birthCert}
              onChange={setBirthCert}
              hint="PDF or image"
              error={!isEdit && docError && !birthCert ? docError : undefined}
            />
            <SingleDocField
              label="Aadhaar / Government ID"
              required={!isEdit}
              file={aadhaar}
              onChange={setAadhaar}
              hint="Aadhaar / passport (PDF or image)"
              error={!isEdit && docError && !aadhaar ? docError : undefined}
            />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted">Other documents (optional)</p>
            <AttachmentsField
              files={attachments}
              onChange={setAttachments}
              hint="Transfer certificate (TC), previous marksheets, caste certificate, photos…"
            />
          </div>
          {isEdit && (
            <p className="mt-2 text-xs text-subtle">
              Existing documents are managed on the student&apos;s profile.
            </p>
          )}
        </section>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
