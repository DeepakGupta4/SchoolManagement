import { createResource, textMatch } from "./createResource";

export interface OnlineClass {
  id: string;
  topic: string;
  subject: string;
  teacher: string;
  klass: string;
  platform: string;
  state: string;
  when: string;
  duration: number;
  attendees: number;
  link: string;
  agenda: string;
}

export interface OnlineClassFilters {
  search?: string;
  subject?: string;
  teacher?: string;
  state?: string;
}

export const STATE_META: Record<
  string,
  { label: string; variant: "success" | "info" | "default" | "danger" }
> = {
  live: { label: "Live now", variant: "success" },
  scheduled: { label: "Scheduled", variant: "info" },
  recorded: { label: "Recorded", variant: "default" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export const STATE_OPTIONS = [
  { label: "Live now", value: "live" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Recorded", value: "recorded" },
  { label: "Cancelled", value: "cancelled" },
];

export const SUBJECT_OPTIONS = [
  "Accountancy", "Biology", "Chemistry", "Computer Science", "Electronics",
  "English", "French", "Hindi", "History", "Mathematics", "Physics", "Sanskrit",
];

export const TEACHER_OPTIONS = [
  "Dr. Priya Sharma", "Mr. Amit Joshi", "Mr. Naveen Chawla", "Mr. Rahul Verma",
  "Mr. Rakesh Yadav", "Mr. Suresh Kumar", "Ms. Anita Patel", "Ms. Deepa Nair",
  "Ms. Elena D'Souza", "Ms. Kavita Singh", "Ms. Lata Trivedi", "Ms. Meenakshi Rao",
  "Ms. Ritu Bansal",
];

export const PLATFORM_OPTIONS = ["Google Meet", "Zoom", "Teams"];

export const KLASS_OPTIONS = [
  "VII-A", "VIII-A", "IX-A", "IX-B", "X-A", "X-B", "XI-A", "XI-B", "XII-A", "XII-B", "XII-C",
];

const seed: OnlineClass[] = [
  { id: "OC01", topic: "Quadratic Equations — Drill",  subject: "Mathematics",      teacher: "Dr. Priya Sharma",  klass: "X-A",    platform: "Google Meet", state: "live",      when: "Now · started 10:05", duration: 45, attendees: 118, link: "meet.google.com/xkq-mnvz-abc",   agenda: "Board-pattern drill on roots and discriminants." },
  { id: "OC02", topic: "Python Loops & Functions",     subject: "Computer Science", teacher: "Mr. Amit Joshi",    klass: "X-B",    platform: "Zoom",        state: "live",      when: "Now · started 10:15", duration: 60, attendees: 74,  link: "zoom.us/j/8842103991",           agenda: "Live coding: for/while loops and user-defined functions." },
  { id: "OC03", topic: "Organic Chemistry — Alkanes",  subject: "Chemistry",        teacher: "Ms. Kavita Singh",  klass: "XI-B",   platform: "Google Meet", state: "live",      when: "Now · started 10:20", duration: 50, attendees: 88,  link: "meet.google.com/pqr-stuv-wxy",   agenda: "Nomenclature and preparation of alkanes." },
  { id: "OC04", topic: "Wave Optics — Interference",   subject: "Physics",          teacher: "Mr. Rahul Verma",   klass: "XII-A",  platform: "Zoom",        state: "scheduled", when: "Today · 11:30",       duration: 45, attendees: 86,  link: "zoom.us/j/7712449021",           agenda: "Young's double slit experiment with numericals." },
  { id: "OC05", topic: "The Monsoon — Essay Workshop", subject: "English",          teacher: "Ms. Anita Patel",   klass: "IX-A",   platform: "Google Meet", state: "scheduled", when: "Today · 12:15",       duration: 40, attendees: 112, link: "meet.google.com/lmn-opqr-stu",   agenda: "Structuring descriptive essays; peer review." },
  { id: "OC06", topic: "Genetics — Mendel's Laws",     subject: "Biology",          teacher: "Ms. Deepa Nair",    klass: "XII-B",  platform: "Teams",       state: "scheduled", when: "Today · 14:00",       duration: 50, attendees: 68,  link: "teams.microsoft.com/l/bio-xii",  agenda: "Monohybrid and dihybrid crosses." },
  { id: "OC07", topic: "Mughal Empire — Overview",     subject: "History",          teacher: "Mr. Suresh Kumar",  klass: "IX-B",   platform: "Google Meet", state: "scheduled", when: "Tomorrow · 09:30",    duration: 40, attendees: 105, link: "meet.google.com/hij-klmn-opq",   agenda: "Akbar to Aurangzeb — administration and decline." },
  { id: "OC08", topic: "Ledger Posting — Practice",    subject: "Accountancy",      teacher: "Ms. Ritu Bansal",   klass: "XII-C",  platform: "Zoom",        state: "scheduled", when: "Tomorrow · 11:00",    duration: 45, attendees: 52,  link: "zoom.us/j/6620037745",           agenda: "Journal to ledger posting with worked examples." },
  { id: "OC09", topic: "Hindi Vyakaran — Sandhi",      subject: "Hindi",            teacher: "Ms. Meenakshi Rao", klass: "VII-A",  platform: "Google Meet", state: "recorded",  when: "18 Jul · 10:00",      duration: 38, attendees: 128, link: "drive.google.com/hin-sandhi-07", agenda: "Swar sandhi and vyanjan sandhi rules." },
  { id: "OC10", topic: "Trigonometry — Identities",    subject: "Mathematics",      teacher: "Dr. Priya Sharma",  klass: "X-B",    platform: "Zoom",        state: "recorded",  when: "17 Jul · 09:15",      duration: 47, attendees: 121, link: "drive.google.com/math-trig-11",  agenda: "Proving standard identities step by step." },
  { id: "OC11", topic: "Thermodynamics — Part 2",      subject: "Physics",          teacher: "Mr. Rahul Verma",   klass: "XI-A",   platform: "Zoom",        state: "recorded",  when: "17 Jul · 12:30",      duration: 52, attendees: 79,  link: "drive.google.com/phy-thermo-02", agenda: "First law applications and thermodynamic processes." },
  { id: "OC12", topic: "French Greetings & Numbers",   subject: "French",           teacher: "Ms. Elena D'Souza", klass: "XI-A",   platform: "Teams",       state: "recorded",  when: "16 Jul · 15:00",      duration: 35, attendees: 32,  link: "teams.microsoft.com/l/fr-xi",    agenda: "Salutations, chiffres 1-100 and pronunciation." },
  { id: "OC13", topic: "Cell Structure — Revision",    subject: "Biology",          teacher: "Ms. Deepa Nair",    klass: "XI-B",   platform: "Google Meet", state: "recorded",  when: "16 Jul · 11:45",      duration: 42, attendees: 71,  link: "drive.google.com/bio-cell-05",   agenda: "Organelles recap ahead of the unit test." },
  { id: "OC14", topic: "Sanskrit Shloka Recitation",   subject: "Sanskrit",         teacher: "Ms. Lata Trivedi",  klass: "VIII-A", platform: "Google Meet", state: "cancelled", when: "16 Jul · 09:00",      duration: 30, attendees: 0,   link: "—",                              agenda: "Cancelled — teacher on medical leave." },
  { id: "OC15", topic: "Robotics — Sensor Basics",     subject: "Electronics",      teacher: "Mr. Naveen Chawla", klass: "IX-B",   platform: "Teams",       state: "scheduled", when: "Tomorrow · 15:30",    duration: 60, attendees: 26,  link: "teams.microsoft.com/l/rob-ix",   agenda: "IR and ultrasonic sensors with a live demo." },
  { id: "OC16", topic: "Algebra Doubt Clearing",       subject: "Mathematics",      teacher: "Mr. Rakesh Yadav",  klass: "IX-A",   platform: "Zoom",        state: "scheduled", when: "Tomorrow · 16:00",    duration: 30, attendees: 94,  link: "zoom.us/j/5590118824",           agenda: "Open doubt session on linear equations." },
];

export const onlineClassesApi = createResource<OnlineClass, OnlineClassFilters>({
  idPrefix: "oc",
  seed,
  defaults: { attendees: 0, state: "scheduled", agenda: "" },
  matches: (row, { search, subject, teacher, state }) => {
    if (subject && row.subject !== subject) return false;
    if (teacher && row.teacher !== teacher) return false;
    if (state && row.state !== state) return false;
    return textMatch(search, row.topic, row.subject, row.teacher, row.klass);
  },
});
