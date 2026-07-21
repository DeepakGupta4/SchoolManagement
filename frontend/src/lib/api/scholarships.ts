import { createResource, textMatch } from "./createResource";

export interface Scholarship {
  id: string;
  /** Human-facing scholarship code, e.g. "SCH001". Must stay unique. */
  code: string;
  student: string;
  class: string;
  type: string;
  percentage: number;
  amount: number;
  reason: string;
  status: string;
  since: string;
}

export interface ScholarshipFilters {
  search?: string;
  status?: string;
}

export const SCHOLARSHIP_TYPE_OPTIONS = ["Merit", "Need-Based", "Sports", "Cultural"];

export const SCHOLARSHIP_CLASS_OPTIONS = [
  "6-A",
  "6-B",
  "7-A",
  "7-B",
  "8-A",
  "8-B",
  "9-A",
  "9-B",
  "10-A",
  "10-B",
  "11-A",
  "11-B",
  "12-A",
  "12-B",
];

export const SCHOLARSHIP_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Expired", value: "expired" },
];

const seed: Scholarship[] = [
  { id: "sch_001", code: "SCH001", student: "Priya Patel",  class: "9-B",  type: "Merit",      percentage: 100, amount: 10900, reason: "School Topper",        status: "active",  since: "Apr 2025" },
  { id: "sch_002", code: "SCH002", student: "Ananya Singh", class: "7-A",  type: "Need-Based", percentage: 50,  amount: 4400,  reason: "Financial Hardship",   status: "active",  since: "Apr 2025" },
  { id: "sch_003", code: "SCH003", student: "Rohan Das",    class: "9-A",  type: "Sports",     percentage: 75,  amount: 8175,  reason: "State Level Athlete",  status: "active",  since: "Apr 2025" },
  { id: "sch_004", code: "SCH004", student: "Meera Nair",   class: "11-B", type: "Merit",      percentage: 50,  amount: 6900,  reason: "Top 5 in Class",       status: "active",  since: "Apr 2025" },
  { id: "sch_005", code: "SCH005", student: "Vikram Joshi", class: "6-B",  type: "Need-Based", percentage: 25,  amount: 1650,  reason: "Single Parent Family", status: "pending", since: "Jul 2025" },
  { id: "sch_006", code: "SCH006", student: "Kavya Reddy",  class: "12-B", type: "Cultural",   percentage: 30,  amount: 4140,  reason: "National Dance Award", status: "active",  since: "Apr 2025" },
  { id: "sch_007", code: "SCH007", student: "Deepak Yadav", class: "10-B", type: "Need-Based", percentage: 50,  amount: 5450,  reason: "BPL Category",         status: "expired", since: "Jan 2025" },
  { id: "sch_008", code: "SCH008", student: "Sunita Devi",  class: "8-A",  type: "Need-Based", percentage: 75,  amount: 6600,  reason: "Orphan Student",       status: "active",  since: "Apr 2025" },
];

const isAll = (value?: string) => !value || value === "All";

export const scholarshipsApi = createResource<Scholarship, ScholarshipFilters>({
  idPrefix: "sch",
  seed,
  uniqueBy: { field: "code", label: "Scholarship ID" },
  defaults: { status: "pending", percentage: 0, amount: 0 },
  matches: (row, { search, status }) => {
    if (!isAll(status) && row.status !== status) return false;
    return textMatch(search, row.student, row.code, row.type, row.class, row.reason);
  },
});
