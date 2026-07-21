import { createResource, textMatch } from "./createResource";

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

const ALL = AUDIENCE_OPTIONS;

const seed: Announcement[] = [
  { id: "AN001", title: "Annual Sports Day 2025",        body: "Annual Sports Day will be held on 28th July 2025. All students must participate in at least one event.", author: "Principal", audience: ALL,           category: "Event",     date: "10 Jul 2025", pinned: true,  views: 320 },
  { id: "AN002", title: "Fee Payment Deadline Reminder", body: "Last date for fee payment for Q2 is 20th July 2025. Late fee will be charged after the deadline.",      author: "Accounts",  audience: ["Parents"],  category: "Finance",   date: "12 Jul 2025", pinned: true,  views: 210 },
  { id: "AN003", title: "Staff Meeting – 18 July",       body: "All teaching and non-teaching staff are required to attend the meeting on 18th July at 3:00 PM.",       author: "Principal", audience: ["Staff"],    category: "Meeting",   date: "13 Jul 2025", pinned: false, views: 85 },
  { id: "AN004", title: "Exam Schedule Released",        body: "The mid-term exam schedule for classes 6–12 has been released. Check the notice board for details.",    author: "Exam Cell", audience: ["Students"], category: "Exam",      date: "14 Jul 2025", pinned: false, views: 450 },
  { id: "AN005", title: "Library Closed on 19 July",     body: "The school library will remain closed on 19th July 2025 due to maintenance work.",                      author: "Librarian", audience: ALL,          category: "Notice",    date: "15 Jul 2025", pinned: false, views: 130 },
  { id: "AN006", title: "New Bus Route Added",           body: "A new bus route covering Sector 14 and Sector 18 has been added from 21st July 2025.",                  author: "Transport", audience: ["Parents"],  category: "Transport", date: "15 Jul 2025", pinned: false, views: 95 },
  { id: "AN007", title: "Parent-Teacher Meeting",        body: "PTM for classes 9–12 is scheduled on 26th July 2025 from 9 AM to 1 PM. Attendance is mandatory.",       author: "Principal", audience: ["Parents"],  category: "Meeting",   date: "16 Jul 2025", pinned: true,  views: 280 },
  { id: "AN008", title: "Holiday Notice – Eid",          body: "School will remain closed on 17th July 2025 on account of Eid. Classes will resume on 18th July.",      author: "Admin",     audience: ALL,          category: "Holiday",   date: "16 Jul 2025", pinned: false, views: 510 },
];

export const announcementsApi = createResource<Announcement, AnnouncementFilters>({
  idPrefix: "ann",
  seed,
  uniqueBy: { field: "title", label: "Announcement title" },
  defaults: { views: 0, pinned: false },
  matches: (row, { search, category, audience, pinnedOnly }) => {
    if (pinnedOnly && !row.pinned) return false;
    if (category && row.category !== category) return false;
    if (audience && !row.audience.includes(audience)) return false;
    return textMatch(search, row.title, row.body, row.author, row.category);
  },
});
