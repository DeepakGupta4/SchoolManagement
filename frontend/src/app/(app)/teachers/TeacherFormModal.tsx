"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { Modal, Button, Input, Textarea, Select, MultiSelect, useToast } from "@/components/ui";
import { PhotoFrame } from "@/components/cards/PhotoFrame";
import { teacherSchema, type TeacherSchema } from "@/lib/schemas/teacher";
import { digitsOnly10 } from "@/lib/phone";
import { fileToDataUrl } from "@/lib/image";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { DEPARTMENT_OPTIONS } from "@/lib/api/teachers";
import { AttachmentsField } from "@/components/AttachmentsField";
import { uploadDocumentFiles } from "@/lib/api/documents";
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
  avatar: "",
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
  /** Returns the saved teacher (so attachments can be uploaded), or null on error. */
  onSubmit: (values: TeacherFormValues) => Promise<Teacher | null | void>;
}

export function TeacherFormModal({
  open,
  onOpenChange,
  teacher,
  onSubmit,
}: TeacherFormModalProps) {
  const isEdit = Boolean(teacher);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  // Files attached in the form, uploaded once the teacher record has an id.
  const [attachments, setAttachments] = useState<File[]>([]);
  const [savingDocs, setSavingDocs] = useState(false);
  const { classNames } = useClassOptions();
  const { subjectNames } = useSubjectOptions();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
    defaultValues: emptyValues,
  });

  // useWatch (not watch) so the React Compiler can still optimise this component.
  const avatar = useWatch({ control, name: "avatar" });
  const firstName = useWatch({ control, name: "firstName" });
  const lastName = useWatch({ control, name: "lastName" });

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

  // Repopulate on open so the previous teacher's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(teacher ? { ...teacher } : emptyValues);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttachments([]);
  }, [open, teacher, reset]);

  const submit = handleSubmit(async (values) => {
    const saved = await onSubmit(values as TeacherFormValues);
    if (!saved) return; // save failed — keep the form open (error already shown)
    if (attachments.length > 0) {
      setSavingDocs(true);
      const name = `${values.firstName} ${values.lastName}`.trim();
      const { uploaded, failed } = await uploadDocumentFiles("teacher", saved.id, name, attachments);
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
      title={isEdit ? "Edit teacher" : "Add new teacher"}
      description={
        isEdit
          ? "Update this teacher's record. Changes apply immediately."
          : "Create a teacher record. Employee ID must be unique."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || savingDocs}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting || savingDocs}>
            {savingDocs ? "Uploading…" : isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create teacher"}
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
              name={`${firstName} ${lastName}`.trim() || "Teacher"}
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
            <Input label="Phone" required hint="10-digit mobile number" inputMode="numeric" maxLength={10} placeholder="9876543210" {...register("phone", { onChange: digitsOnly10 })} error={errors.phone?.message} />
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
                  options={subjectNames}
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
                  options={classNames}
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

        <section>
          <SectionTitle>Documents</SectionTitle>
          <AttachmentsField
            files={attachments}
            onChange={setAttachments}
            hint="Optional — qualifications, ID proofs, certificates. You can also add these later from the profile."
          />
        </section>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
