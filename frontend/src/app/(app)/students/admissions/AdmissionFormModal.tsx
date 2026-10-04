"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { Modal, Button, Input, Select, Textarea, useToast } from "@/components/ui";
import { PhotoFrame } from "@/components/cards/PhotoFrame";
import { admissionSchema, type AdmissionSchema } from "@/lib/schemas/admission";
import { digitsOnly10, PHONE_REGEX } from "@/lib/phone";
import { useClassOptions } from "@/hooks/useClassOptions";
import { fileToDataUrl } from "@/lib/image";
import { MIN_STUDENT_DOB, MAX_STUDENT_DOB, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";
import {
  SOURCE_OPTIONS,
  STAGE_OPTIONS,
  GENDER_OPTIONS,
  CATEGORY_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  generateApplicationNo,
  type Application,
} from "@/lib/api/admissions";

// Datalist suggestions — pick or type, mirroring the student admission form.
const NATIONALITY_SUGGESTIONS = ["Indian", "Nepali", "Bhutanese", "Bangladeshi", "Other"];
const RELIGION_SUGGESTIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi", "Jewish", "Other"];
const OCCUPATION_SUGGESTIONS = [
  "Business", "Service / Job", "Government Service", "Private Service", "Self-employed",
  "Farmer", "Teacher", "Doctor", "Engineer", "Lawyer", "Accountant", "Shopkeeper",
  "Driver", "Labourer", "Homemaker", "Retired", "Other",
];

/** Static blanks. applicationNo is minted in the open effect (no Math.random in render). */
function makeEmpty(): AdmissionSchema {
  return {
    applicationNo: "",
    name: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    classApplied: "",
    bloodGroup: "",
    category: "",
    previousSchool: "",
    parent: "",
    relation: "",
    phone: "",
    email: "",
    address: "",
    source: SOURCE_OPTIONS[0],
    appliedOn: TODAY_ISO,
    stage: "enquiry",
    score: 0,
    notes: "",
    avatar: "",
    medicalNotes: "",
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
    motherTongue: "",
    aadhaarNo: "",
    placeOfBirth: "",
    annualIncome: "",
    correspondenceAddress: "",
    emergencyContact: "",
    previousClass: "",
    previousBoard: "",
    tcNumber: "",
    previousResult: "",
    transportRequired: false,
    pickupPoint: "",
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-1 text-xs font-semibold uppercase tracking-wide text-subtle">{children}</p>
  );
}

interface AdmissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Application | null;
  saving?: boolean;
  onSubmit: (values: Omit<Application, "id">) => Promise<void>;
}

const GENDER_SELECT = GENDER_OPTIONS.map((g) => ({ label: g, value: g }));
const CATEGORY_SELECT = CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }));
const BLOOD_SELECT = BLOOD_GROUP_OPTIONS.map((b) => ({ label: b, value: b }));
const SOURCE_SELECT = SOURCE_OPTIONS.map((s) => ({ label: s, value: s }));

export function AdmissionFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: AdmissionFormModalProps) {
  const isEdit = Boolean(record);
  const { toast } = useToast();
  const { classOptions } = useClassOptions();

  const [uploading, setUploading] = useState(false);
  // Who the school's primary contact is — drives the saved parent/guardian, so we
  // never ask for "parent" and "father" as two separate people.
  const [primaryContact, setPrimaryContact] = useState<"father" | "mother" | "other">("father");
  const [contactError, setContactError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<AdmissionSchema>({
    resolver: zodResolver(admissionSchema),
    defaultValues: makeEmpty(),
  });

  // useWatch (not watch) so the React Compiler can still optimise this component.
  const avatar = useWatch({ control, name: "avatar" });
  const firstName = useWatch({ control, name: "firstName" });
  const lastName = useWatch({ control, name: "lastName" });

  // Repopulate on open so the previous record's values can't leak through. A fresh
  // application number is minted for every new form (in the effect, not render).
  useEffect(() => {
    if (!open) return;
    if (record) {
      reset({ ...makeEmpty(), ...record });
    } else {
      reset({ ...makeEmpty(), applicationNo: generateApplicationNo() });
    }
    // Edit: keep the saved parent visible under "Other" so nothing is lost.
    // Create: default the primary contact to Father.
    const t = setTimeout(() => {
      setPrimaryContact(record ? "other" : "father");
      setContactError(null);
    }, 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

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

  const submit = handleSubmit(async (values) => {
    // Derive the saved parent/guardian from the chosen primary contact, so the
    // record stores one contact — not "parent" and "father" as duplicate people.
    const pick = {
      father: { name: values.fatherName, relation: "Father", phone: values.fatherPhone, email: values.fatherEmail },
      mother: { name: values.motherName, relation: "Mother", phone: values.motherPhone, email: values.motherEmail },
      other: { name: values.parent, relation: values.relation || "Guardian", phone: values.phone, email: values.email },
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

    // Build a complete record (blanks coalesced from the optional form fields) so
    // the stored application and the enrolled student both get concrete values.
    const finalValues: Omit<Application, "id"> = {
      applicationNo: values.applicationNo,
      name: `${values.firstName} ${values.lastName}`.trim(),
      firstName: values.firstName,
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth,
      gender: values.gender,
      classApplied: values.classApplied,
      bloodGroup: values.bloodGroup ?? "",
      category: values.category ?? "",
      previousSchool: values.previousSchool ?? "",
      parent: gName,
      relation: pick.relation || "Guardian",
      phone: gPhone,
      email: pick.email || "",
      address: values.address,
      source: values.source,
      appliedOn: values.appliedOn,
      stage: values.stage,
      score: values.score,
      notes: values.notes ?? "",
      avatar: values.avatar ?? "",
      medicalNotes: values.medicalNotes ?? "",
      fatherName: values.fatherName ?? "",
      fatherOccupation: values.fatherOccupation ?? "",
      fatherPhone: values.fatherPhone ?? "",
      fatherEmail: values.fatherEmail ?? "",
      motherName: values.motherName ?? "",
      motherOccupation: values.motherOccupation ?? "",
      motherPhone: values.motherPhone ?? "",
      motherEmail: values.motherEmail ?? "",
      nationality: values.nationality ?? "",
      religion: values.religion ?? "",
      motherTongue: values.motherTongue ?? "",
      aadhaarNo: values.aadhaarNo ?? "",
      placeOfBirth: values.placeOfBirth ?? "",
      annualIncome: values.annualIncome ?? "",
      correspondenceAddress: values.correspondenceAddress ?? "",
      emergencyContact: values.emergencyContact ?? "",
      previousClass: values.previousClass ?? "",
      previousBoard: values.previousBoard ?? "",
      tcNumber: values.tcNumber ?? "",
      previousResult: values.previousResult ?? "",
      transportRequired: values.transportRequired ?? false,
      pickupPoint: values.pickupPoint ?? "",
    };

    await onSubmit(finalValues);
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit application" : "New admission application"}
      description={
        isEdit
          ? "Update this application. Changes apply immediately."
          : "Capture the applicant's full details. Fields marked * are required."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create application"}
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
              name={`${firstName ?? ""} ${lastName ?? ""}`.trim() || "Applicant"}
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
                      e.target.value = "";
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
              <p className="text-xs text-subtle">
                Passport-style photo. Carries over to the student record on enrolment.
              </p>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Applicant details</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" required {...register("firstName")} error={errors.firstName?.message} />
            <Input label="Last name" required {...register("lastName")} error={errors.lastName?.message} />
            <Input label="Date of birth" type="date" required min={MIN_STUDENT_DOB} max={MAX_STUDENT_DOB} {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />
            <Select label="Gender" required placeholder="Select gender" options={GENDER_SELECT} {...register("gender")} error={errors.gender?.message} />
            <Select label="Class applied" required placeholder="Select class" options={classOptions} {...register("classApplied")} error={errors.classApplied?.message} />
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
            <Select label="Blood group" placeholder="Not recorded" options={BLOOD_SELECT} {...register("bloodGroup")} error={errors.bloodGroup?.message} />
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
              <Input label="Guardian name" required {...register("parent")} error={errors.parent?.message} />
              <Input label="Relation" required placeholder="e.g. Uncle, Grandfather" {...register("relation")} error={errors.relation?.message} />
              <Input label="Guardian phone" required inputMode="numeric" maxLength={10} placeholder="9876543210" {...register("phone", { onChange: digitsOnly10 })} error={errors.phone?.message} />
              <Input label="Guardian email" type="email" {...register("email")} error={errors.email?.message} />
            </div>
          )}

          <div className="mt-4">
            <Textarea label="Address" required rows={2} placeholder="House no, street, city, state, PIN" {...register("address")} error={errors.address?.message} />
          </div>

          {contactError && <p className="mt-2 text-xs text-danger">{contactError}</p>}
        </section>

        <section>
          <SectionTitle>Other Particulars (optional)</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nationality" list="nationality-list" hint="Defaults to Indian — change if needed" {...register("nationality")} error={errors.nationality?.message} />
            <datalist id="nationality-list">{NATIONALITY_SUGGESTIONS.map((n) => <option key={n} value={n} />)}</datalist>
            <Input label="Religion" list="religion-list" placeholder="Pick or type" {...register("religion")} error={errors.religion?.message} />
            <datalist id="religion-list">{RELIGION_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
            <Select label="Category" placeholder="Select category" options={CATEGORY_SELECT} {...register("category")} error={errors.category?.message} />
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
            <input type="checkbox" {...register("transportRequired")} className="focus-ring size-4 cursor-pointer rounded-sm accent-primary" />
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

        <section>
          <SectionTitle>Admission process</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Application number" required placeholder="ADM-2026-0483" {...register("applicationNo")} error={errors.applicationNo?.message} />
            <Select label="Source" required options={SOURCE_SELECT} {...register("source")} error={errors.source?.message} />
            <Input label="Applied on" type="date" required min={MIN_RECORD_DATE} max={TODAY_ISO} {...register("appliedOn")} error={errors.appliedOn?.message} />
            <Select label="Stage" required options={STAGE_OPTIONS} {...register("stage")} error={errors.stage?.message} />
            <Input label="Entrance score" type="number" min={0} max={100} hint="Leave at 0 until the test is taken." {...register("score")} error={errors.score?.message} />
          </div>
          <div className="mt-4">
            <Textarea label="Notes" placeholder="Anything the admissions team should know…" {...register("notes")} error={errors.notes?.message} />
          </div>
        </section>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
