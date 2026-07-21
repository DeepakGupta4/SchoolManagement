import { createResource, textMatch } from "./createResource";

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

const ALL = NOTICE_AUDIENCE_OPTIONS;

const seed: Notice[] = [
  { id: "NC001", title: "Mid-Term Exam Schedule",          body: "Mid-term exams for classes 6–12 will be held from 28 July to 5 August 2025. Detailed timetable attached.", category: "Exam",      audience: ["Students"], date: "10 Jul 2025", expiry: "28 Jul 2025", pinned: true,  priority: "High",   postedBy: "Exam Cell" },
  { id: "NC002", title: "Fee Payment Last Date",           body: "Last date for Q2 fee payment is 20 July 2025. Students with pending fees will not be allowed in exams.",     category: "Finance",   audience: ["Parents"],  date: "11 Jul 2025", expiry: "20 Jul 2025", pinned: true,  priority: "High",   postedBy: "Accounts" },
  { id: "NC003", title: "Annual Sports Day",               body: "Annual Sports Day will be held on 28 July 2025. Registration for events open till 22 July.",                 category: "Event",     audience: ALL,          date: "12 Jul 2025", expiry: "28 Jul 2025", pinned: true,  priority: "Medium", postedBy: "Sports Dept" },
  { id: "NC004", title: "Library Book Return Notice",      body: "All students must return borrowed library books by 25 July 2025 to avoid fine.",                             category: "General",   audience: ["Students"], date: "13 Jul 2025", expiry: "25 Jul 2025", pinned: false, priority: "Low",    postedBy: "Librarian" },
  { id: "NC005", title: "Holiday – Eid Celebration",       body: "School will remain closed on 17 July 2025 on account of Eid. Classes resume on 18 July.",                    category: "Holiday",   audience: ALL,          date: "14 Jul 2025", expiry: "17 Jul 2025", pinned: false, priority: "Medium", postedBy: "Admin" },
  { id: "NC006", title: "Parent-Teacher Meeting",          body: "PTM for classes 9–12 scheduled on 26 July 2025 from 9 AM to 1 PM. Attendance is mandatory for parents.",     category: "Meeting",   audience: ["Parents"],  date: "14 Jul 2025", expiry: "26 Jul 2025", pinned: false, priority: "High",   postedBy: "Principal" },
  { id: "NC007", title: "New Canteen Menu",                body: "Updated canteen menu effective from 21 July 2025. Healthy meal options added for all students.",             category: "General",   audience: ALL,          date: "15 Jul 2025", expiry: "31 Jul 2025", pinned: false, priority: "Low",    postedBy: "Canteen" },
  { id: "NC008", title: "Staff Training Workshop",         body: "Mandatory training workshop for all teaching staff on 19 July 2025 from 10 AM to 3 PM in the auditorium.",   category: "Meeting",   audience: ["Staff"],    date: "15 Jul 2025", expiry: "19 Jul 2025", pinned: false, priority: "High",   postedBy: "HR Dept" },
  { id: "NC009", title: "Science Exhibition Registration", body: "Students interested in the Science Exhibition (Aug 10) must register with their class teacher by 25 July.",  category: "Event",     audience: ["Students"], date: "16 Jul 2025", expiry: "25 Jul 2025", pinned: false, priority: "Medium", postedBy: "Science Dept" },
  { id: "NC010", title: "Bus Route Update",                body: "New bus stops added in Sector 14 and Sector 18 from 21 July 2025. Contact transport office for details.",    category: "Transport", audience: ["Parents"],  date: "16 Jul 2025", expiry: "21 Jul 2025", pinned: false, priority: "Low",    postedBy: "Transport" },
];

export const noticesApi = createResource<Notice, NoticeFilters>({
  idPrefix: "ntc",
  seed,
  uniqueBy: { field: "title", label: "Notice title" },
  defaults: { pinned: false, priority: "Medium" },
  matches: (row, { search, category, audience, priority }) => {
    if (category && row.category !== category) return false;
    if (audience && !row.audience.includes(audience)) return false;
    if (priority && row.priority !== priority) return false;
    return textMatch(search, row.title, row.body, row.postedBy, row.category);
  },
});
