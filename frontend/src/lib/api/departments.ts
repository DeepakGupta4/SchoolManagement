import { createApiResource } from "./createApiResource";

export interface Department {
  id: string;
  name: string;
  /** Short department code, e.g. "MATH". Must stay unique. */
  code: string;
  hod: string;
  block: string;
  teachers: number;
  subjects: string[];
  budget: number;
  spent: number;
  status: string;
}

export interface DepartmentFilters {
  search?: string;
  block?: string;
  status?: string;
}

export const DEPARTMENT_BLOCK_OPTIONS = [
  "Main Building",
  "Administrative Block",
  "Pre-Primary Wing",
  "Primary Wing",
  "Middle Wing",
  "Senior Wing",
  "Science Block",
  "Computer Lab",
  "Library Block",
  "Activity Block",
  "Assembly Hall",
  "Sports Ground",
  "Music & Arts Room",
  "Staff Room",
  "Counselling Room",
  "Medical Room",
];

export const DEPARTMENT_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Under review", value: "review" },
  { label: "Planned", value: "planned" },
];

export const DEPARTMENT_SUBJECT_OPTIONS = [
  "Accountancy",
  "Algebra",
  "Athletics",
  "Bharatanatyam",
  "Biology",
  "Business Studies",
  "Calculus",
  "Chemistry",
  "Civics",
  "Composition",
  "Craft",
  "Drawing",
  "Electronics",
  "French",
  "Gadya",
  "Geography",
  "Geometry",
  "German",
  "Grammar",
  "History",
  "Java",
  "Life Skills",
  "Literature",
  "Padya",
  "Physics",
  "Python",
  "Reading Skills",
  "Reference",
  "Remedial",
  "Retail",
  "Sculpture",
  "Shloka",
  "Tabla",
  "Team Sports",
  "Vocal",
  "Vyakaran",
  "Web Design",
  "Yoga",
];

export const departmentsApi = createApiResource<Department, DepartmentFilters>("/api/departments");
