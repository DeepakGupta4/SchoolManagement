"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, MultiSelect } from "@/components/ui";
import { busRouteSchema, type BusRouteSchema } from "@/lib/schemas/busRoute";
import {
  ROUTE_DRIVER_OPTIONS,
  ROUTE_STATUS_OPTIONS,
  ROUTE_STOP_OPTIONS,
  type BusRoute,
} from "@/lib/api/busRoutes";

const emptyValues: BusRouteSchema = {
  code: "",
  name: "",
  stops: [ROUTE_STOP_OPTIONS[0]],
  driver: ROUTE_DRIVER_OPTIONS[0],
  bus: "",
  capacity: 40,
  students: 0,
  departure: "",
  arrival: "",
  distance: "",
  status: "active",
};

interface BusRouteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: BusRoute | null;
  saving?: boolean;
  onSubmit: (values: BusRouteSchema) => Promise<void>;
}

export function BusRouteFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: BusRouteFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BusRouteSchema>({
    resolver: zodResolver(busRouteSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit route" : "Add new route"}
      description={
        isEdit
          ? "Update this bus route. Changes apply immediately."
          : "Create a bus route. The route code must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create route"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Route code"
            required
            placeholder="RT009"
            {...register("code")}
            error={errors.code?.message}
          />
          <Input
            label="Route name"
            required
            placeholder="Route I — Vasant Kunj"
            {...register("name")}
            error={errors.name?.message}
          />
          <Select
            label="Driver"
            required
            options={ROUTE_DRIVER_OPTIONS.map((d) => ({ label: d, value: d }))}
            {...register("driver")}
            error={errors.driver?.message}
          />
          <Input
            label="Bus number"
            required
            placeholder="DL-09-QR-4567"
            {...register("bus")}
            error={errors.bus?.message}
          />
          <Input
            label="Departure"
            required
            placeholder="7:00 AM"
            {...register("departure")}
            error={errors.departure?.message}
          />
          <Input
            label="Arrival"
            required
            placeholder="8:15 AM"
            {...register("arrival")}
            error={errors.arrival?.message}
          />
          <Input
            label="Students"
            type="number"
            min={0}
            {...register("students")}
            error={errors.students?.message}
          />
          <Input
            label="Capacity"
            type="number"
            min={1}
            {...register("capacity")}
            error={errors.capacity?.message}
          />
          <Input
            label="Distance"
            required
            placeholder="18 km"
            {...register("distance")}
            error={errors.distance?.message}
          />
          <Select
            label="Status"
            required
            options={ROUTE_STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
        </div>

        <Controller
          control={control}
          name="stops"
          render={({ field }) => (
            <MultiSelect
              label="Stops"
              required
              options={ROUTE_STOP_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.stops?.message}
            />
          )}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
