import { createResource, textMatch } from "./createResource";

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

const seed: SchoolEvent[] = [
  {
    id: "evt_001",
    code: "EV-2401",
    name: "Annual Day — Rangmanch 2026",
    category: "Cultural",
    date: "2026-08-14",
    venue: "Main Auditorium",
    coordinator: "Meenakshi Iyer",
    participants: 420,
    capacity: 600,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_002",
    code: "EV-2402",
    name: "Inter-House Sports Day",
    category: "Sports",
    date: "2026-08-02",
    venue: "School Playground",
    coordinator: "Rajesh Nair",
    participants: 512,
    capacity: 550,
    registration: "closing-soon",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_003",
    code: "EV-2403",
    name: "Science Exhibition — Vigyan Mela",
    category: "Academic",
    date: "2026-07-24",
    venue: "Physics & Chemistry Labs",
    coordinator: "Dr. Anjali Deshmukh",
    participants: 168,
    capacity: 200,
    registration: "open",
    status: "upcoming",
    mediaCount: 4,
  },
  {
    id: "evt_004",
    code: "EV-2404",
    name: "Independence Day Celebration",
    category: "Cultural",
    date: "2026-08-15",
    venue: "Assembly Ground",
    coordinator: "Sunita Bhardwaj",
    participants: 980,
    capacity: 1000,
    registration: "not-required",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_005",
    code: "EV-2405",
    name: "Inter-School Debate — Vaad Vivaad",
    category: "Competition",
    date: "2026-07-19",
    venue: "Seminar Hall B",
    coordinator: "Farhan Qureshi",
    participants: 64,
    capacity: 80,
    registration: "closed",
    status: "ongoing",
    mediaCount: 12,
  },
  {
    id: "evt_006",
    code: "EV-2406",
    name: "Annual Athletics Meet",
    category: "Sports",
    date: "2026-06-28",
    venue: "District Stadium, Pune",
    coordinator: "Rajesh Nair",
    participants: 245,
    capacity: 300,
    registration: "closed",
    status: "completed",
    mediaCount: 86,
  },
  {
    id: "evt_007",
    code: "EV-2407",
    name: "Mathematics Olympiad — Round 2",
    category: "Competition",
    date: "2026-07-30",
    venue: "Exam Hall, Block C",
    coordinator: "Priya Ramanathan",
    participants: 132,
    capacity: 150,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_008",
    code: "EV-2408",
    name: "Ganesh Chaturthi Cultural Evening",
    category: "Cultural",
    date: "2026-09-05",
    venue: "Main Auditorium",
    coordinator: "Meenakshi Iyer",
    participants: 210,
    capacity: 600,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_009",
    code: "EV-2409",
    name: "Inter-House Kabaddi Championship",
    category: "Sports",
    date: "2026-07-11",
    venue: "Indoor Sports Complex",
    coordinator: "Vikram Chauhan",
    participants: 96,
    capacity: 120,
    registration: "closed",
    status: "completed",
    mediaCount: 54,
  },
  {
    id: "evt_010",
    code: "EV-2410",
    name: "Hindi Diwas Kavita Recitation",
    category: "Competition",
    date: "2026-09-14",
    venue: "Seminar Hall A",
    coordinator: "Kavita Joshi",
    participants: 78,
    capacity: 100,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_011",
    code: "EV-2411",
    name: "Robotics & Coding Hackathon",
    category: "Academic",
    date: "2026-08-22",
    venue: "Computer Lab 1 & 2",
    coordinator: "Arjun Mehta",
    participants: 88,
    capacity: 96,
    registration: "closing-soon",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_012",
    code: "EV-2412",
    name: "Annual Art & Craft Exhibition",
    category: "Cultural",
    date: "2026-06-14",
    venue: "Activity Centre",
    coordinator: "Shalini Kapoor",
    participants: 156,
    capacity: 180,
    registration: "closed",
    status: "completed",
    mediaCount: 120,
  },
  {
    id: "evt_013",
    code: "EV-2413",
    name: "Inter-School Cricket Tournament",
    category: "Sports",
    date: "2026-10-08",
    venue: "District Stadium, Pune",
    coordinator: "Vikram Chauhan",
    participants: 44,
    capacity: 60,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_014",
    code: "EV-2414",
    name: "Quiz Bee — Gyan Sangram",
    category: "Competition",
    date: "2026-05-30",
    venue: "Seminar Hall B",
    coordinator: "Farhan Qureshi",
    participants: 120,
    capacity: 120,
    registration: "closed",
    status: "completed",
    mediaCount: 38,
  },
  {
    id: "evt_015",
    code: "EV-2415",
    name: "Teachers' Day Programme",
    category: "Cultural",
    date: "2026-09-05",
    venue: "Assembly Ground",
    coordinator: "Sunita Bhardwaj",
    participants: 640,
    capacity: 1000,
    registration: "not-required",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_016",
    code: "EV-2416",
    name: "Model United Nations — PuneMUN",
    category: "Academic",
    date: "2026-11-21",
    venue: "Conference Centre",
    coordinator: "Priya Ramanathan",
    participants: 52,
    capacity: 140,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "evt_017",
    code: "EV-2417",
    name: "Swachh Bharat Cleanliness Drive",
    category: "Academic",
    date: "2026-04-18",
    venue: "Kothrud Ward, Pune",
    coordinator: "Nikhil Bansal",
    participants: 310,
    capacity: 350,
    registration: "closed",
    status: "completed",
    mediaCount: 62,
  },
  {
    id: "evt_018",
    code: "EV-2418",
    name: "Inter-House Swimming Gala",
    category: "Sports",
    date: "2026-07-05",
    venue: "School Swimming Pool",
    coordinator: "Rajesh Nair",
    participants: 0,
    capacity: 90,
    registration: "closed",
    status: "cancelled",
    mediaCount: 0,
  },
];

export const eventsApi = createResource<SchoolEvent, EventFilters, "code">({
  idPrefix: "evt",
  seed,
  uniqueBy: [
    { field: "name", label: "Event name" },
    { field: "code", label: "Event code" },
  ],
  // Reference numbers continue the seed sequence rather than restarting.
  generate: (count) => ({ code: `EV-${2400 + count + 1}` }),
  defaults: {
    participants: 0,
    capacity: 0,
    mediaCount: 0,
    registration: "open",
    status: "upcoming",
  },
  matches: (row, { search, category, status }) => {
    if (category && row.category !== category) return false;
    if (status && row.status !== status) return false;
    // `code` is what the table shows — searching `id` made the visible
    // reference unfindable and the invisible one findable.
    return textMatch(search, row.name, row.venue, row.coordinator, row.code);
  },
});
