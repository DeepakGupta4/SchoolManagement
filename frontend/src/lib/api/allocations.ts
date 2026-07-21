import { createResource, textMatch } from "./createResource";

export interface Allocation {
  id: string;
  teacher: string;
  /** Employee ID, e.g. "TCH-1041". Must stay unique. */
  empId: string;
  dept: string;
  subject: string;
  classes: string[];
  periods: number;
  labs: number;
  room: string;
}

export interface AllocationFilters {
  search?: string;
  dept?: string;
  klass?: string;
  load?: string;
}

/** Periods a full-time teacher is contracted for in a week. */
export const MAX_PERIODS = 36;

export type LoadBand = "Overloaded" | "Optimal" | "Moderate" | "Under-used";

export const LOAD_BAND_OPTIONS: LoadBand[] = [
  "Overloaded",
  "Optimal",
  "Moderate",
  "Under-used",
];

/** Under 45% is under-used, 90% and over is an overload risk. */
export function loadPercent(periods: number) {
  return Math.min(100, Math.round((periods / MAX_PERIODS) * 100));
}

export function loadBandLabel(periods: number): LoadBand {
  const pct = loadPercent(periods);
  if (pct >= 90) return "Overloaded";
  if (pct >= 70) return "Optimal";
  if (pct >= 45) return "Moderate";
  return "Under-used";
}

export const ALLOCATION_DEPT_OPTIONS = [
  "Commerce",
  "Computer Science",
  "English",
  "Fine Arts",
  "Foreign Languages",
  "Hindi",
  "Mathematics",
  "Music & Dance",
  "Physical Education",
  "Sanskrit",
  "Science",
  "Social Science",
  "Special Education",
  "Vocational Studies",
];

export const ALLOCATION_CLASS_OPTIONS = [
  "VI-A",
  "VI-B",
  "VII-A",
  "VII-B",
  "VIII-A",
  "VIII-B",
  "IX-A",
  "IX-B",
  "X-A",
  "X-B",
  "X-C",
  "XI-A",
  "XI-B",
  "XI-C",
  "XII-A",
  "XII-B",
  "XII-C",
];

const seed: Allocation[] = [
  { id: "alloc_001", teacher: "Dr. Priya Sharma",   empId: "TCH-1041", dept: "Mathematics",        subject: "Mathematics",      classes: ["X-A", "X-B", "XII-A"],             periods: 32, labs: 0,  room: "R-204" },
  { id: "alloc_002", teacher: "Mr. Rahul Verma",    empId: "TCH-1052", dept: "Science",            subject: "Physics",          classes: ["XI-A", "XII-A"],                   periods: 28, labs: 6,  room: "Lab-1" },
  { id: "alloc_003", teacher: "Ms. Anita Patel",    empId: "TCH-1063", dept: "English",            subject: "English",          classes: ["VI-A", "VII-B", "VIII-A"],         periods: 30, labs: 0,  room: "R-108" },
  { id: "alloc_004", teacher: "Mr. Suresh Kumar",   empId: "TCH-1074", dept: "Social Science",     subject: "History",          classes: ["IX-A", "X-C"],                     periods: 22, labs: 0,  room: "R-112" },
  { id: "alloc_005", teacher: "Ms. Kavita Singh",   empId: "TCH-1085", dept: "Science",            subject: "Chemistry",        classes: ["XI-B", "XII-B"],                   periods: 34, labs: 8,  room: "Lab-2" },
  { id: "alloc_006", teacher: "Mr. Amit Joshi",     empId: "TCH-1096", dept: "Computer Science",   subject: "Computer Science", classes: ["VIII-B", "IX-B", "X-A"],           periods: 26, labs: 10, room: "IT-1" },
  { id: "alloc_007", teacher: "Ms. Deepa Nair",     empId: "TCH-1107", dept: "Science",            subject: "Biology",          classes: ["XI-A", "XII-B"],                   periods: 24, labs: 6,  room: "Lab-3" },
  { id: "alloc_008", teacher: "Mr. Vikram Gupta",   empId: "TCH-1118", dept: "Physical Education", subject: "Phy. Education",   classes: ["VI-A", "VII-A", "VIII-A", "IX-A"], periods: 18, labs: 0,  room: "Ground" },
  { id: "alloc_009", teacher: "Ms. Meenakshi Rao",  empId: "TCH-1129", dept: "Hindi",              subject: "Hindi",            classes: ["VI-B", "VII-A"],                   periods: 20, labs: 0,  room: "R-105" },
  { id: "alloc_010", teacher: "Ms. Ritu Bansal",    empId: "TCH-1130", dept: "Commerce",           subject: "Accountancy",      classes: ["XI-C", "XII-C"],                   periods: 30, labs: 0,  room: "R-301" },
  { id: "alloc_011", teacher: "Mr. Kartik Iyer",    empId: "TCH-1141", dept: "Music & Dance",      subject: "Music",            classes: ["VI-A", "VII-B"],                   periods: 12, labs: 0,  room: "Studio" },
  { id: "alloc_012", teacher: "Ms. Shalini Desai",  empId: "TCH-1152", dept: "Fine Arts",          subject: "Drawing",          classes: ["VI-B", "VIII-B"],                  periods: 14, labs: 0,  room: "Art-1" },
  { id: "alloc_013", teacher: "Ms. Lata Trivedi",   empId: "TCH-1163", dept: "Sanskrit",           subject: "Sanskrit",         classes: ["VII-A", "VIII-A"],                 periods: 16, labs: 0,  room: "R-110" },
  { id: "alloc_014", teacher: "Mr. Naveen Chawla",  empId: "TCH-1174", dept: "Vocational Studies", subject: "Electronics",      classes: ["IX-B", "X-B"],                     periods: 10, labs: 4,  room: "Voc-1" },
  { id: "alloc_015", teacher: "Ms. Farida Sheikh",  empId: "TCH-1185", dept: "Special Education",  subject: "Remedial",         classes: ["VI-A", "VII-A"],                   periods: 15, labs: 0,  room: "R-002" },
  { id: "alloc_016", teacher: "Ms. Elena D'Souza",  empId: "TCH-1196", dept: "Foreign Languages",  subject: "French",           classes: ["XI-A", "XII-A"],                   periods: 12, labs: 0,  room: "R-306" },
  { id: "alloc_017", teacher: "Mr. Rakesh Yadav",   empId: "TCH-1207", dept: "Mathematics",        subject: "Mathematics",      classes: ["VIII-A", "IX-A", "IX-B"],          periods: 35, labs: 0,  room: "R-206" },
  { id: "alloc_018", teacher: "Ms. Sneha Kulkarni", empId: "TCH-1218", dept: "English",            subject: "Literature",       classes: ["XI-B", "XII-B"],                   periods: 21, labs: 0,  room: "R-115" },
];

export const allocationsApi = createResource<Allocation, AllocationFilters>({
  idPrefix: "alloc",
  seed,
  uniqueBy: { field: "empId", label: "Employee ID" },
  defaults: { periods: 0, labs: 0 },
  matches: (row, { search, dept, klass, load }) => {
    if (dept && row.dept !== dept) return false;
    if (klass && !row.classes.includes(klass)) return false;
    if (load && loadBandLabel(row.periods) !== load) return false;
    return (
      textMatch(search, row.teacher, row.empId, row.subject, row.dept, row.room) ||
      row.classes.some((c) => textMatch(search, c))
    );
  },
});
