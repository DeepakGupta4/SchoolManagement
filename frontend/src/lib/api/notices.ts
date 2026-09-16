import { createApiResource } from "./createApiResource";

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: string;
  /** Who the notice is addressed to. Empty is not allowed. */
  audience: string[];
  date: string;
  expiry: string;
  pinned: boolean;
  priority: string;
  postedBy: string;
}

export interface NoticeFilters {
  search?: string;
  category?: string;
  audience?: string;
  priority?: string;
}

export const NOTICE_CATEGORIES = [
  "Exam",
  "Finance",
  "Event",
  "General",
  "Holiday",
  "Meeting",
  "Transport",
];

export const NOTICE_AUDIENCE_OPTIONS = ["Students", "Parents", "Staff"];

export const NOTICE_PRIORITIES = ["High", "Medium", "Low"];

export const NOTICE_DEPARTMENTS = [
  "Exam Cell",
  "Accounts",
  "Sports Dept",
  "Librarian",
  "Admin",
  "Principal",
  "Canteen",
  "HR Dept",
  "Science Dept",
  "Transport",
];

/** "16 Jul 2025" — the format every notice date is stored in. */
export const formatNoticeDay = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const noticesApi = createApiResource<Notice, NoticeFilters>("/api/notices");
