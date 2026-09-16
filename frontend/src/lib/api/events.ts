import { createApiResource } from "./createApiResource";

export type EventCategory = "Cultural" | "Sports" | "Academic" | "Competition";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type RegistrationStatus = "open" | "closing-soon" | "closed" | "not-required";

export interface SchoolEvent {
  id: string;
  /** Human-facing reference shown in the UI, e.g. "EV-2401". The `id` is
   *  internal and must never be displayed. */
  code: string;
  name: string;
  category: EventCategory;
  /** ISO date, e.g. "2026-08-14". */
  date: string;
  venue: string;
  coordinator: string;
  participants: number;
  capacity: number;
  registration: RegistrationStatus;
  status: EventStatus;
  mediaCount: number;
}

export interface EventFilters {
  search?: string;
  category?: string;
  status?: string;
}

export const EVENT_CATEGORY_OPTIONS: { label: string; value: EventCategory }[] = [
  { label: "Cultural", value: "Cultural" },
  { label: "Sports", value: "Sports" },
  { label: "Academic", value: "Academic" },
  { label: "Competition", value: "Competition" },
];

export const EVENT_STATUS_OPTIONS: { label: string; value: EventStatus }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export const EVENT_REGISTRATION_OPTIONS: { label: string; value: RegistrationStatus }[] = [
  { label: "Open", value: "open" },
  { label: "Closing soon", value: "closing-soon" },
  { label: "Closed", value: "closed" },
  { label: "Not required", value: "not-required" },
];

export const eventsApi = createApiResource<SchoolEvent, EventFilters, "code">("/api/events");
