"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, MultiSelect, Select } from "@/components/ui";
import { alumnusSchema, type AlumnusSchema } from "@/lib/schemas/alumnus";
import {
  BATCH_OPTIONS,
  CITY_OPTIONS,
  INTEREST_OPTIONS,
  STREAM_OPTIONS,
  type Alumnus,
} from "@/lib/api/alumni";

const emptyValues: AlumnusSchema = {
  name: "",
  batch: BATCH_OPTIONS[0],
  stream: STREAM_OPTIONS[0],
  occupation: "",
  employer: "",
  city: CITY_OPTIONS[0],
  email: "",
  phone: "",
  mentor: "no",
  interests: [],
};

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
    formState: { errors },
  } = useForm<AlumnusSchema>({
    resolver: zodResolver(alumnusSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  // `mentor` is a boolean on the record but a yes/no select in the form.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record, mentor: record.mentor ? "yes" : "no" } : emptyValues);
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit alumnus" : "Add alumnus"}
      description={
        isEdit
          ? "Update this record. Changes apply immediately."
          : "Register a passed-out student. The email address must be unique."
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
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            required
            placeholder="Rohan Deshpande"
            {...register("name")}
            error={errors.name?.message}
          />
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
          <Select
            label="City"
            required
            options={CITY_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("city")}
            error={errors.city?.message}
          />
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
            placeholder="98765-43210"
            {...register("phone")}
            error={errors.phone?.message}
          />
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

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
