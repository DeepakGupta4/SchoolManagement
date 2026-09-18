"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Users, ClipboardList } from "lucide-react";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { admissionSchema, type AdmissionSchema } from "@/lib/schemas/admission";
import { digitsOnly10 } from "@/lib/phone";
import {
  CLASS_APPLIED_OPTIONS,
  SOURCE_OPTIONS,
  STAGE_OPTIONS,
  GENDER_OPTIONS,
  RELATION_OPTIONS,
  CATEGORY_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  generateApplicationNo,
  type Application,
} from "@/lib/api/admissions";

function makeEmpty(): AdmissionSchema {
  return {
    applicationNo: generateApplicationNo(),
    name: "",
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
    appliedOn: new Date().toISOString().slice(0, 10),
    stage: "enquiry",
    score: 0,
    notes: "",
  };
}

/** A titled group of fields inside the form. */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof GraduationCap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary-soft text-primary-text">
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

interface AdmissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Application | null;
  saving?: boolean;
  onSubmit: (values: AdmissionSchema) => Promise<void>;
}

export function AdmissionFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: AdmissionFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdmissionSchema>({
    resolver: zodResolver(admissionSchema),
    defaultValues: makeEmpty(),
  });

  // Repopulate on open so the previous record's values can't leak through.
  // A fresh application number is minted for every new form.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : makeEmpty());
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

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
      <form onSubmit={submit} className="flex flex-col gap-6">
        {/* ── Applicant ─────────────────────────────────────── */}
        <Section icon={GraduationCap} title="Applicant details">
          <Input
            label="Applicant name"
            required
            placeholder="Aarav Sharma"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            label="Date of birth"
            type="date"
            required
            {...register("dateOfBirth")}
            error={errors.dateOfBirth?.message}
          />
          <Select
            label="Gender"
            required
            placeholder="Select gender"
            options={GENDER_OPTIONS.map((g) => ({ label: g, value: g }))}
            {...register("gender")}
            error={errors.gender?.message}
          />
          <Select
            label="Class applied"
            required
            placeholder="Select class"
            options={CLASS_APPLIED_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("classApplied")}
            error={errors.classApplied?.message}
          />
          <Select
            label="Category"
            placeholder="Select category"
            options={CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("category")}
            error={errors.category?.message}
          />
          <Select
            label="Blood group"
            placeholder="Select blood group"
            options={BLOOD_GROUP_OPTIONS.map((b) => ({ label: b, value: b }))}
            {...register("bloodGroup")}
            error={errors.bloodGroup?.message}
          />
          <div className="sm:col-span-2">
            <Input
              label="Previous school"
              placeholder="Name of last school attended (if any)"
              {...register("previousSchool")}
              error={errors.previousSchool?.message}
            />
          </div>
        </Section>

        {/* ── Parent / guardian ─────────────────────────────── */}
        <Section icon={Users} title="Parent / guardian">
          <Input
            label="Parent / guardian name"
            required
            placeholder="Rohit Sharma"
            {...register("parent")}
            error={errors.parent?.message}
          />
          <Select
            label="Relation"
            required
            placeholder="Select relation"
            options={RELATION_OPTIONS.map((r) => ({ label: r, value: r }))}
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
            type="email"
            placeholder="parent@email.com"
            {...register("email")}
            error={errors.email?.message}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Address"
              required
              rows={2}
              placeholder="House no, street, city, state, PIN"
              {...register("address")}
              error={errors.address?.message}
            />
          </div>
        </Section>

        {/* ── Admission process ─────────────────────────────── */}
        <Section icon={ClipboardList} title="Admission process">
          <Input
            label="Application number"
            required
            placeholder="ADM-2026-0483"
            {...register("applicationNo")}
            error={errors.applicationNo?.message}
          />
          <Select
            label="Source"
            required
            options={SOURCE_OPTIONS.map((s) => ({ label: s, value: s }))}
            {...register("source")}
            error={errors.source?.message}
          />
          <Input
            label="Applied on"
            type="date"
            required
            {...register("appliedOn")}
            error={errors.appliedOn?.message}
          />
          <Select
            label="Stage"
            required
            options={STAGE_OPTIONS}
            {...register("stage")}
            error={errors.stage?.message}
          />
          <Input
            label="Entrance score"
            type="number"
            min={0}
            max={100}
            hint="Leave at 0 until the test is taken."
            {...register("score")}
            error={errors.score?.message}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Notes"
              placeholder="Anything the admissions team should know…"
              {...register("notes")}
              error={errors.notes?.message}
            />
          </div>
        </Section>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
