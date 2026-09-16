import { createApiResource } from "./createApiResource";

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

export const onlineClassesApi = createApiResource<OnlineClass, OnlineClassFilters>(
  "/api/online-classes"
);
