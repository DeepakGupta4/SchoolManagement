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
}

export const timetableApi = createApiResource<TimetableEntry, TimetableFilters>("/api/timetable");
