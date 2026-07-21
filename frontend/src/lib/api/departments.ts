import { createResource, textMatch } from "./createResource";

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
  "Main Block",
  "Science Block",
  "Senior Wing",
  "IT Wing",
  "Activity Block",
  "Sports Complex",
  "Library Block",
  "Counselling Wing",
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

const seed: Department[] = [
  { id: "dept_001", name: "Mathematics",        code: "MATH", hod: "Dr. Priya Sharma",  block: "Science Block",    teachers: 9,  subjects: ["Algebra", "Geometry", "Calculus"],      budget: 480000, spent: 402000, status: "active" },
  { id: "dept_002", name: "Science",            code: "SCI",  hod: "Mr. Rahul Verma",   block: "Science Block",    teachers: 12, subjects: ["Physics", "Chemistry", "Biology"],      budget: 725000, spent: 690000, status: "active" },
  { id: "dept_003", name: "English",            code: "ENG",  hod: "Ms. Anita Patel",   block: "Main Block",       teachers: 8,  subjects: ["Literature", "Grammar", "Composition"], budget: 310000, spent: 218000, status: "active" },
  { id: "dept_004", name: "Social Science",     code: "SST",  hod: "Mr. Suresh Kumar",  block: "Main Block",       teachers: 7,  subjects: ["History", "Civics", "Geography"],       budget: 285000, spent: 190000, status: "active" },
  { id: "dept_005", name: "Hindi",              code: "HIN",  hod: "Ms. Meenakshi Rao", block: "Main Block",       teachers: 6,  subjects: ["Vyakaran", "Gadya", "Padya"],           budget: 240000, spent: 176000, status: "active" },
  { id: "dept_006", name: "Computer Science",   code: "CS",   hod: "Mr. Amit Joshi",    block: "IT Wing",          teachers: 5,  subjects: ["Python", "Java", "Web Design"],         budget: 620000, spent: 585000, status: "active" },
  { id: "dept_007", name: "Commerce",           code: "COM",  hod: "Ms. Ritu Bansal",   block: "Senior Wing",      teachers: 6,  subjects: ["Accountancy", "Business Studies"],      budget: 295000, spent: 121000, status: "active" },
  { id: "dept_008", name: "Physical Education", code: "PE",   hod: "Mr. Vikram Gupta",  block: "Sports Complex",   teachers: 4,  subjects: ["Athletics", "Yoga", "Team Sports"],     budget: 415000, spent: 388000, status: "active" },
  { id: "dept_009", name: "Fine Arts",          code: "ART",  hod: "Ms. Shalini Desai", block: "Activity Block",   teachers: 3,  subjects: ["Drawing", "Craft", "Sculpture"],        budget: 165000, spent: 92000,  status: "active" },
  { id: "dept_010", name: "Music & Dance",      code: "MUS",  hod: "Mr. Kartik Iyer",   block: "Activity Block",   teachers: 3,  subjects: ["Vocal", "Tabla", "Bharatanatyam"],      budget: 148000, spent: 137000, status: "active" },
  { id: "dept_011", name: "Sanskrit",           code: "SAN",  hod: "Ms. Lata Trivedi",  block: "Main Block",       teachers: 2,  subjects: ["Shloka", "Vyakaran"],                   budget: 96000,  spent: 41000,  status: "review" },
  { id: "dept_012", name: "Library Sciences",   code: "LIB",  hod: "Ms. Kavita Joshi",  block: "Library Block",    teachers: 2,  subjects: ["Reading Skills", "Reference"],          budget: 210000, spent: 158000, status: "active" },
  { id: "dept_013", name: "Special Education",  code: "SPED", hod: "Ms. Farida Sheikh", block: "Counselling Wing", teachers: 3,  subjects: ["Remedial", "Life Skills"],              budget: 182000, spent: 74000,  status: "active" },
  { id: "dept_014", name: "Vocational Studies", code: "VOC",  hod: "Mr. Naveen Chawla", block: "Activity Block",   teachers: 2,  subjects: ["Electronics", "Retail"],                budget: 134000, spent: 22000,  status: "review" },
  { id: "dept_015", name: "Foreign Languages",  code: "FLN",  hod: "Ms. Elena D'Souza", block: "Senior Wing",      teachers: 2,  subjects: ["French", "German"],                     budget: 118000, spent: 39000,  status: "planned" },
];

export const departmentsApi = createResource<Department, DepartmentFilters>({
  idPrefix: "dept",
  seed,
  uniqueBy: { field: "code", label: "Department code" },
  defaults: { teachers: 0, spent: 0, status: "active" },
  matches: (row, { search, block, status }) => {
    if (block && row.block !== block) return false;
    if (status && row.status !== status) return false;
    return (
      textMatch(search, row.name, row.code, row.hod, row.block) ||
      row.subjects.some((s) => textMatch(search, s))
    );
  },
});
