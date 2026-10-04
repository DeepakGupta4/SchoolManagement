import { createApiResource } from "./createApiResource";

export interface TimetableEntry {
  id: string;
  className: string;
  day: string;
  period: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface TimetableFilters {
  search?: string;
  className?: string;
  day?: string;
  subject?: string;
  /** Exact teacher-name match (used to pull one teacher's periods). */
  teacher?: string;
  /** Page size; raised above the 200 default when a whole day is needed. */
  limit?: number;
}

export const timetableApi = createApiResource<TimetableEntry, TimetableFilters>("/api/timetable");
