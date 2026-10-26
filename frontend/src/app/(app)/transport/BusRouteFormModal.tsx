"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Modal, Button, Input, Select, Field } from "@/components/ui";
import { busRouteSchema, type BusRouteSchema } from "@/lib/schemas/busRoute";
import { ROUTE_STATUS_OPTIONS, type BusRoute } from "@/lib/api/busRoutes";
import { listUsers, type ManagedUser } from "@/lib/api/users";

// Create mode starts completely blank — no stop, driver, capacity or route name
// is pre-filled. The route name is instead suggested from the stops the user
// actually picks (see `suggestRouteName`). Status keeps its natural default
// since it's a fixed enum a new route is expected to start "active" in.
const emptyValues: DefaultValues<BusRouteSchema> = {
  code: "",
  name: "",
  stops: [],
  driver: "",
  driverEmail: "",
  bus: "",
  capacity: undefined,
  students: 0,
  departure: "",
  arrival: "",
  distance: "",
  fee: 0,
  status: "active",
};

/**
 * Suggests a route name from the chosen stops, e.g. first → last
 * ("Main Gate → City Centre"). Only the user's own stops are used — no location
 * is ever invented. Empty selection yields an empty suggestion.
 */
function suggestRouteName(stops: string[]): string {
  if (stops.length === 0) return "";
  if (stops.length === 1) return stops[0];
  return `${stops[0]} → ${stops[stops.length - 1]}`;
}

/**
 * The route's pickup points — entered by the school itself, in order. No stop
 * list is hardcoded: you type each stop (or reuse one from another route), and
 * can reorder or remove them. The order IS the pickup sequence.
 */
function StopsEditor({
  value,
  onChange,
  suggestions,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  error?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const s = raw.trim();
    if (!s) return;
    if (value.some((v) => v.toLowerCase() === s.toLowerCase())) {
      setDraft("");
      return; // already added — keep stops unique
    }
    onChange([...value, s]);
    setDraft("");
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const remaining = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <Field
      label="Stops"
      required
      error={error}
      hint="Add pickup points in order. Type a stop and press Enter (or Add)."
    >
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="e.g. Main Gate, Sector 4 Market, Civil Lines…"
          aria-label="Add a stop"
        />
        <Button type="button" variant="outline" onClick={() => add(draft)} disabled={!draft.trim()}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <ol className="mt-2 flex flex-col gap-1.5">
          {value.map((stop, i) => (
            <li
              key={`${stop}-${i}`}
              className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary-text">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-text">{stop}</span>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${stop} up`}
                className="focus-ring rounded p-1 text-subtle transition-colors hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label={`Move ${stop} down`}
                className="focus-ring rounded p-1 text-subtle transition-colors hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${stop}`}
                className="focus-ring rounded p-1 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {remaining.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-xs text-subtle">Reuse a stop from your other routes:</p>
          <div className="flex flex-wrap gap-1.5">
            {remaining.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="focus-ring rounded-full border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:bg-surface-hover"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </Field>
  );
}

interface BusRouteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: BusRoute | null;
  /** Existing routes — used to block a duplicate route name and reuse stops. */
  existing?: BusRoute[];
  saving?: boolean;
  onSubmit: (values: BusRouteSchema) => Promise<void>;
}

export function BusRouteFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: BusRouteFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

  // Real driver accounts (users with the "driver" role) — the driver picker lists
  // these so a route links to an actual login, instead of a hardcoded name list.
  const [drivers, setDrivers] = useState<ManagedUser[]>([]);
  const driversLoaded = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BusRouteSchema>({
    resolver: zodResolver(busRouteSchema),
    defaultValues: emptyValues,
  });

  // The route name we last auto-filled from the stops. Lets us refresh the
  // suggestion as stops change, while never clobbering a name the user typed.
  const lastSuggestedName = useRef("");

  // Load the school's driver accounts once, the first time the modal opens. A
  // failure (e.g. a non-admin without the users endpoint) is non-fatal — the
  // driver field still accepts a typed name.
  useEffect(() => {
    if (!open || driversLoaded.current) return;
    driversLoaded.current = true;
    let cancelled = false;
    listUsers()
      .then((us) => {
        if (!cancelled) setDrivers(us.filter((u) => u.role === "driver"));
      })
      .catch(() => {
        /* non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
    // An edit-mode name is the user's saved value, not a suggestion, so start
    // with a blank marker — that way changing stops never overwrites it.
    lastSuggestedName.current = "";
    // Deferred: clearing the duplicate-name error synchronously in an effect
    // trips the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Case-insensitive set of names already taken by *other* routes.
  const takenNames = useMemo(() => {
    const set = new Set<string>();
    for (const r of existing) {
      if (record && r.id === record.id) continue;
      set.add(r.name.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  // Every distinct stop used across the school's other routes — offered as
  // one-tap reuse so a stop network builds up over time (never hardcoded).
  const stopSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of existing) {
      for (const s of r.stops ?? []) {
        const name = s.trim();
        const key = name.toLowerCase();
        if (name && !seen.has(key)) {
          seen.add(key);
          out.push(name);
        }
      }
    }
    return out.sort((a, b) => a.localeCompare(b));
  }, [existing]);

  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    if (takenNames.has(name.toLowerCase())) {
      setDupError(`"${name}" already exists. Pick a different route name.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, name });
  });

  // Keep the stops list authoritative: when it changes, refresh the suggested
  // route name — but only while the name is still empty or matches our last
  // suggestion, so a name the user typed themselves is left untouched.
  const syncNameFromStops = (stops: string[]) => {
    const current = getValues("name").trim();
    if (current !== "" && current !== lastSuggestedName.current) return;
    const suggestion = suggestRouteName(stops);
    setValue("name", suggestion, { shouldDirty: true });
    lastSuggestedName.current = suggestion;
  };

  // Driver field keeps RHF in sync AND auto-links the login email when the typed
  // name matches a real driver account.
  const driverReg = register("driver");

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
          {/* Route name — auto-suggested from the stops (first → last), but fully
              editable. No preset names: it follows the school's own stops. */}
          <Input
            label="Route name"
            required
            placeholder="Add stops to auto-fill — or type your own"
            hint={dupError ? undefined : "Suggested from your first & last stop. Edit freely."}
            {...register("name")}
            error={errors.name?.message ?? dupError ?? undefined}
          />

          {/* Driver — pick a registered driver account (auto-links their login
              email) or type a name for a driver not yet on the system. */}
          <Input
            label="Driver"
            required
            list="route-driver-accounts"
            placeholder={drivers.length ? "Pick a driver or type a name" : "Type the driver's name"}
            hint={
              drivers.length
                ? "Pick a registered driver to auto-link their login."
                : undefined
            }
            {...driverReg}
            onChange={(e) => {
              driverReg.onChange(e);
              const match = drivers.find(
                (d) => d.name.trim().toLowerCase() === e.target.value.trim().toLowerCase()
              );
              if (match) setValue("driverEmail", match.email, { shouldDirty: true });
            }}
            error={errors.driver?.message}
          />
          <datalist id="route-driver-accounts">
            {drivers.map((d) => (
              <option key={d.id} value={d.name}>
                {d.email}
              </option>
            ))}
          </datalist>

          {/* Login email — links this route to a driver's account so the driver
              portal can match them to their route(s). Auto-filled on driver pick. */}
          <Input
            label="Driver email (login)"
            type="email"
            placeholder="driver@school.edu — optional"
            hint="Link this route to the driver's login account."
            {...register("driverEmail")}
            error={errors.driverEmail?.message}
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
            required
            type="number"
            min={1}
            placeholder="e.g. 40"
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
          {/* Monthly transport fee — billed to each student assigned to this route. */}
          <Input
            label="Fee (₹/month)"
            type="number"
            min={0}
            placeholder="e.g. 1200"
            hint="Billed to students who ride this route"
            {...register("fee")}
            error={errors.fee?.message}
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
            <StopsEditor
              value={field.value ?? []}
              onChange={(next) => {
                field.onChange(next);
                syncNameFromStops(next);
              }}
              suggestions={stopSuggestions}
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
