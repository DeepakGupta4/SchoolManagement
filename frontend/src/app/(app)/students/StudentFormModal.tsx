"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Textarea, Select } from "@/components/ui";
import { studentSchema, type StudentSchema } from "@/lib/schemas/student";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "@/lib/api/students";
import type { Student, StudentFormValues } from "@/types/student";

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
  className: CLASS_OPTIONS[0],
  section: SECTION_OPTIONS[0],
  status: "active",
  admissionDate: new Date().toISOString().slice(0, 10),
  address: "",
  guardian: { name: "", relation: "Father", phone: "", email: "", occupation: "" },
  medicalNotes: "",
};

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  student?: Student | null;
  onSubmit: (values: StudentFormValues) => Promise<void>;
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: emptyValues,
  });

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
          }
        : emptyValues
    );
  }, [open, student, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values as StudentFormValues);
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit student" : "Add new student"}
      description={
        isEdit
          ? "Update this student's record. Changes apply immediately."
          : "Create a student record. Admission number must be unique."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create student"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <section>
          <SectionTitle>Identity</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" required {...register("firstName")} error={errors.firstName?.message} />
            <Input label="Last name" required {...register("lastName")} error={errors.lastName?.message} />
            <Input label="Admission no." required {...register("admissionNo")} error={errors.admissionNo?.message} />
            <Input label="Roll no." required {...register("rollNo")} error={errors.rollNo?.message} />
            <Input label="Date of birth" type="date" required {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />
            <Select label="Gender" required options={GENDER_OPTIONS} {...register("gender")} error={errors.gender?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Contact</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" required {...register("email")} error={errors.email?.message} />
            <Input label="Phone" required hint="10-digit mobile number" {...register("phone")} error={errors.phone?.message} />
          </div>
          <div className="mt-4">
            <Textarea label="Address" required {...register("address")} error={errors.address?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Academics</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Class" required options={toOptions(CLASS_OPTIONS)} {...register("className")} error={errors.className?.message} />
            <Select label="Section" required options={toOptions(SECTION_OPTIONS)} {...register("section")} error={errors.section?.message} />
            <Input label="Admission date" type="date" required {...register("admissionDate")} error={errors.admissionDate?.message} />
            <Select label="Status" required options={STATUS_OPTIONS} {...register("status")} error={errors.status?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Guardian</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Guardian name" required {...register("guardian.name")} error={errors.guardian?.name?.message} />
            <Input label="Relation" required {...register("guardian.relation")} error={errors.guardian?.relation?.message} />
            <Input label="Guardian phone" required {...register("guardian.phone")} error={errors.guardian?.phone?.message} />
            <Input label="Guardian email" type="email" {...register("guardian.email")} error={errors.guardian?.email?.message} />
            <Input label="Occupation" {...register("guardian.occupation")} error={errors.guardian?.occupation?.message} />
          </div>
        </section>

        <section>
          <SectionTitle>Medical</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Blood group" placeholder="Not recorded" options={BLOOD_OPTIONS} {...register("bloodGroup")} error={errors.bloodGroup?.message} />
          </div>
          <div className="mt-4">
            <Textarea label="Medical notes" hint="Allergies, conditions, medication" {...register("medicalNotes")} error={errors.medicalNotes?.message} />
          </div>
        </section>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
