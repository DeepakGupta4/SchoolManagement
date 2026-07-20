"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Textarea, Select, MultiSelect } from "@/components/ui";
import { teacherSchema, type TeacherSchema } from "@/lib/schemas/teacher";
import {
  SUBJECT_OPTIONS,
  DEPARTMENT_OPTIONS,
  TEACHER_CLASS_OPTIONS,
} from "@/lib/api/teachers";
import type { Teacher, TeacherFormValues } from "@/types/teacher";

const toOptions = (values: readonly string[]) => values.map((v) => ({ label: v, value: v }));

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const EMPLOYMENT_OPTIONS = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Contract", value: "contract" },
  { label: "Visiting", value: "visiting" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "On leave", value: "on-leave" },
  { label: "Inactive", value: "inactive" },
  { label: "Resigned", value: "resigned" },
];

const emptyValues: TeacherSchema = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "female",
  dateOfBirth: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  department: DEPARTMENT_OPTIONS[0],
  subjects: [],
  classes: [],
  qualification: "",
  experienceYears: 0,
  employmentType: "full-time",
  status: "active",
  address: "",
  salary: 0,
  isClassTeacher: false,
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-1 text-xs font-semibold uppercase tracking-wide text-subtle">{children}</p>
  );
}

interface TeacherFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  teacher?: Teacher | null;
  onSubmit: (values: TeacherFormValues) => Promise<void>;
}

export function TeacherFormModal({
  open,
  onOpenChange,
  teacher,
  onSubmit,
}: TeacherFormModalProps) {
  const isEdit = Boolean(teacher);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous teacher's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(teacher ? { ...teacher } : emptyValues);
  }, [open, teacher, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values as TeacherFormValues);
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit teacher" : "Add new teacher"}
      description={
        isEdit
          ? "Update this teacher's record. Changes apply immediately."
          : "Create a teacher record. Employee ID must be unique."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create teacher"}
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
            <Input label="Employee ID" required {...register("employeeId")} error={errors.employeeId?.message} />
            <Select label="Gender" required options={GENDER_OPTIONS} {...register("gender")} error={errors.gender?.message} />
            <Input label="Date of birth" type="date" required {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />
            <Input label="Joining date" type="date" required {...register("joiningDate")} error={errors.joiningDate?.message} />
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
          <SectionTitle>Teaching</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Department" required options={toOptions(DEPARTMENT_OPTIONS)} {...register("department")} error={errors.department?.message} />
            <Input label="Qualification" required hint="e.g. M.Sc, B.Ed" {...register("qualification")} error={errors.qualification?.message} />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <Controller
              control={control}
              name="subjects"
              render={({ field }) => (
                <MultiSelect
                  label="Subjects"
                  required
                  options={SUBJECT_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.subjects?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="classes"
              render={({ field }) => (
                <MultiSelect
                  label="Assigned classes"
                  hint="Leave empty if not yet assigned"
                  options={TEACHER_CLASS_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.classes?.message}
                />
              )}
            />
          </div>
        </section>

        <section>
          <SectionTitle>Employment</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Employment type" required options={EMPLOYMENT_OPTIONS} {...register("employmentType")} error={errors.employmentType?.message} />
            <Select label="Status" required options={STATUS_OPTIONS} {...register("status")} error={errors.status?.message} />
            <Input label="Experience (years)" type="number" min={0} required {...register("experienceYears")} error={errors.experienceYears?.message} />
            <Input label="Monthly salary (₹)" type="number" min={0} required {...register("salary")} error={errors.salary?.message} />
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              {...register("isClassTeacher")}
              className="focus-ring size-4 cursor-pointer rounded-sm accent-[var(--primary)]"
            />
            <span className="text-sm text-text">Assign as class teacher</span>
          </label>
        </section>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
