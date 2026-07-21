"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { eventSchema, type EventSchema } from "@/lib/schemas/event";
import {
  EVENT_CATEGORY_OPTIONS,
  EVENT_REGISTRATION_OPTIONS,
  EVENT_STATUS_OPTIONS,
  type SchoolEvent,
} from "@/lib/api/events";

const emptyValues: EventSchema = {
  name: "",
  category: "Cultural",
  date: "",
  venue: "",
  coordinator: "",
  participants: 0,
  capacity: 100,
  registration: "open",
  status: "upcoming",
  mediaCount: 0,
};

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: SchoolEvent | null;
  saving?: boolean;
  onSubmit: (values: EventSchema) => Promise<void>;
}

export function EventFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: EventFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? {
            name: record.name,
            category: record.category,
            date: record.date,
            venue: record.venue,
            coordinator: record.coordinator,
            participants: record.participants,
            capacity: record.capacity,
            registration: record.registration,
            status: record.status,
            mediaCount: record.mediaCount,
          }
        : emptyValues
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit event" : "Create event"}
      description={
        isEdit
          ? "Update this event. Changes appear on the schedule immediately."
          : "Add an event to the school calendar. The event name must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Event name"
          required
          placeholder="Annual Day — Rangmanch 2026"
          {...register("name")}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            required
            options={EVENT_CATEGORY_OPTIONS}
            {...register("category")}
            error={errors.category?.message}
          />
          <Input
            label="Event date"
            type="date"
            required
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Venue"
            required
            placeholder="Main Auditorium"
            {...register("venue")}
            error={errors.venue?.message}
          />
          <Input
            label="Coordinator"
            required
            placeholder="Meenakshi Iyer"
            {...register("coordinator")}
            error={errors.coordinator?.message}
          />
          <Input
            label="Participants"
            type="number"
            min={0}
            {...register("participants")}
            error={errors.participants?.message}
          />
          <Input
            label="Capacity"
            type="number"
            min={1}
            {...register("capacity")}
            error={errors.capacity?.message}
          />
          <Select
            label="Registration"
            required
            options={EVENT_REGISTRATION_OPTIONS}
            {...register("registration")}
            error={errors.registration?.message}
          />
          <Select
            label="Status"
            required
            options={EVENT_STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="Media uploaded"
            type="number"
            min={0}
            hint="Photos and videos published to the gallery."
            {...register("mediaCount")}
            error={errors.mediaCount?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
