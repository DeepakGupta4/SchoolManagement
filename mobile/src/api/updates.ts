import { api } from "./client";

/** A school-wide announcement. Pinned ones belong first in the UI. */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  author: string;
  audience: string[];
  category: string;
  date: string; // free-form — show as-is, never parse
  pinned: boolean;
  views: number;
}

/** A notice-board item (shorter shelf life than an announcement). */
export interface Notice {
  id: string;
  title: string;
  body: string;
  category: string;
  audience: string[];
  date: string; // free-form — show as-is
  expiry: string;
  pinned: boolean;
  priority: string;
  postedBy: string;
}

/** A calendar event. NOTE: the headline field is `name`, not `title`. */
export interface SchoolEvent {
  id: string;
  code: string;
  name: string;
  category: string;
  date: string; // free-form — show as-is
  venue: string;
  coordinator: string;
  participants: number;
  capacity: number;
  registration: string;
  status: string;
  mediaCount: number;
}

/** A day the school is closed. `date` is a reliable YYYY-MM-DD. */
export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: string;
}

export const listAnnouncements = () => api<Announcement[]>("/api/announcements?limit=200");

export const listNotices = () => api<Notice[]>("/api/notices?limit=200");

/** Events is a Standard+ module, so this can throw ApiError 402 on a Starter plan. */
export const listEvents = () => api<SchoolEvent[]>("/api/events?limit=200");

export const listHolidays = () => api<Holiday[]>("/api/holidays?limit=200");
