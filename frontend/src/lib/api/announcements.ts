import { createApiResource } from "./createApiResource";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author: string;
  /** Who the broadcast is addressed to. Empty is not allowed. */
  audience: string[];
  category: string;
  date: string;
  pinned: boolean;
  views: number;
}

export interface AnnouncementFilters {
  search?: string;
  category?: string;
  audience?: string;
  pinnedOnly?: boolean;
}

export const ANNOUNCEMENT_CATEGORIES = [
  "Event",
  "Finance",
  "Meeting",
  "Exam",
  "Notice",
  "Transport",
  "Holiday",
];

export const AUDIENCE_OPTIONS = ["Students", "Parents", "Staff"];

export const ANNOUNCEMENT_AUTHORS = [
  "Principal",
  "Admin",
  "Accounts",
  "Exam Cell",
  "Librarian",
  "Transport",
];

/** "16 Jul 2025" — the format every announcement date is stored in. */
export const formatNoticeDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const announcementsApi = createApiResource<Announcement, AnnouncementFilters>(
  "/api/announcements"
);
