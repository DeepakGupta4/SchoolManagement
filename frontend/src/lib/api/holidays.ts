import { createApiResource } from "./createApiResource";

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: string;
}

export interface HolidayFilters {
  search?: string;
  type?: string;
}

/** Kinds of closed day a school can record. */
export const HOLIDAY_TYPE_OPTIONS = ["Holiday", "Festival", "Vacation", "Event"];

export const holidaysApi = createApiResource<Holiday, HolidayFilters>("/api/holidays");
