import { createResource, textMatch } from "./createResource";

export type LabType = "Physics" | "Chemistry" | "Biology" | "Computer";
export type LabStatus = "operational" | "maintenance" | "closed";

export interface Lab {
  id: string;
  name: string;
  type: LabType;
  block: string;
  capacity: number;
  inCharge: string;
  assistant: string;
  equipmentTotal: number;
  equipmentWorking: number;
  weeklyPracticals: number;
  nextPractical: string;
  nextPracticalClass: string;
  status: LabStatus;
}

export interface LabFilters {
  search?: string;
  type?: string;
  status?: string;
}

export const LAB_TYPE_OPTIONS: { label: string; value: LabType }[] = [
  { label: "Physics", value: "Physics" },
  { label: "Chemistry", value: "Chemistry" },
  { label: "Biology", value: "Biology" },
  { label: "Computer", value: "Computer" },
];

export const LAB_STATUS_OPTIONS: { label: string; value: LabStatus }[] = [
  { label: "Operational", value: "operational" },
  { label: "Under maintenance", value: "maintenance" },
  { label: "Closed", value: "closed" },
];

const seed: Lab[] = [
  {
    id: "lab_001",
    name: "Physics Lab I",
    type: "Physics",
    block: "Science Block, Ground Floor",
    capacity: 40,
    inCharge: "Dr. Anjali Deshmukh",
    assistant: "Sandeep More",
    equipmentTotal: 186,
    equipmentWorking: 179,
    weeklyPracticals: 14,
    nextPractical: "2026-07-22",
    nextPracticalClass: "XII-A · Ohm's Law verification",
    status: "operational",
  },
  {
    id: "lab_002",
    name: "Physics Lab II",
    type: "Physics",
    block: "Science Block, First Floor",
    capacity: 36,
    inCharge: "Suresh Patil",
    assistant: "Sandeep More",
    equipmentTotal: 142,
    equipmentWorking: 121,
    weeklyPracticals: 9,
    nextPractical: "2026-07-23",
    nextPracticalClass: "XI-B · Simple pendulum",
    status: "maintenance",
  },
  {
    id: "lab_003",
    name: "Chemistry Lab I",
    type: "Chemistry",
    block: "Science Block, Ground Floor",
    capacity: 32,
    inCharge: "Kavita Joshi",
    assistant: "Ravi Gaikwad",
    equipmentTotal: 214,
    equipmentWorking: 208,
    weeklyPracticals: 16,
    nextPractical: "2026-07-22",
    nextPracticalClass: "XII-B · Salt analysis",
    status: "operational",
  },
  {
    id: "lab_004",
    name: "Chemistry Lab II",
    type: "Chemistry",
    block: "Science Block, First Floor",
    capacity: 32,
    inCharge: "Nikhil Bansal",
    assistant: "Ravi Gaikwad",
    equipmentTotal: 168,
    equipmentWorking: 160,
    weeklyPracticals: 11,
    nextPractical: "2026-07-24",
    nextPracticalClass: "XI-A · Titration practice",
    status: "operational",
  },
  {
    id: "lab_005",
    name: "Biology Lab I",
    type: "Biology",
    block: "Science Block, Second Floor",
    capacity: 34,
    inCharge: "Dr. Shobha Menon",
    assistant: "Pooja Salunke",
    equipmentTotal: 156,
    equipmentWorking: 151,
    weeklyPracticals: 12,
    nextPractical: "2026-07-25",
    nextPracticalClass: "XII-A · Mitosis in onion root tip",
    status: "operational",
  },
  {
    id: "lab_006",
    name: "Biology Lab II",
    type: "Biology",
    block: "Science Block, Second Floor",
    capacity: 30,
    inCharge: "Priyanka Shinde",
    assistant: "Pooja Salunke",
    equipmentTotal: 98,
    equipmentWorking: 74,
    weeklyPracticals: 7,
    nextPractical: "2026-07-28",
    nextPracticalClass: "X-C · Photosynthesis demo",
    status: "maintenance",
  },
  {
    id: "lab_007",
    name: "Computer Lab 1",
    type: "Computer",
    block: "IT Block, Ground Floor",
    capacity: 48,
    inCharge: "Arjun Mehta",
    assistant: "Sagar Kadam",
    equipmentTotal: 52,
    equipmentWorking: 50,
    weeklyPracticals: 22,
    nextPractical: "2026-07-21",
    nextPracticalClass: "XI-A · Python data structures",
    status: "operational",
  },
  {
    id: "lab_008",
    name: "Computer Lab 2",
    type: "Computer",
    block: "IT Block, First Floor",
    capacity: 48,
    inCharge: "Farhan Qureshi",
    assistant: "Sagar Kadam",
    equipmentTotal: 50,
    equipmentWorking: 46,
    weeklyPracticals: 20,
    nextPractical: "2026-07-21",
    nextPracticalClass: "XII-B · SQL queries",
    status: "operational",
  },
  {
    id: "lab_009",
    name: "Robotics & AtalTinkering Lab",
    type: "Computer",
    block: "IT Block, Second Floor",
    capacity: 24,
    inCharge: "Arjun Mehta",
    assistant: "Sagar Kadam",
    equipmentTotal: 134,
    equipmentWorking: 128,
    weeklyPracticals: 8,
    nextPractical: "2026-07-26",
    nextPracticalClass: "IX-A · Arduino sensors",
    status: "operational",
  },
  {
    id: "lab_010",
    name: "Junior Science Lab",
    type: "Biology",
    block: "Primary Block, Ground Floor",
    capacity: 28,
    inCharge: "Shalini Kapoor",
    assistant: "Pooja Salunke",
    equipmentTotal: 76,
    equipmentWorking: 72,
    weeklyPracticals: 10,
    nextPractical: "2026-07-23",
    nextPracticalClass: "VII-B · Plant cell slides",
    status: "operational",
  },
  {
    id: "lab_011",
    name: "Physics Demonstration Room",
    type: "Physics",
    block: "Science Block, Ground Floor",
    capacity: 60,
    inCharge: "Suresh Patil",
    assistant: "Sandeep More",
    equipmentTotal: 64,
    equipmentWorking: 61,
    weeklyPracticals: 5,
    nextPractical: "2026-07-29",
    nextPracticalClass: "X-A · Optics demo",
    status: "operational",
  },
  {
    id: "lab_012",
    name: "Chemistry Prep & Store Room",
    type: "Chemistry",
    block: "Science Block, Ground Floor",
    capacity: 12,
    inCharge: "Kavita Joshi",
    assistant: "Ravi Gaikwad",
    equipmentTotal: 320,
    equipmentWorking: 316,
    weeklyPracticals: 0,
    nextPractical: "2026-08-03",
    nextPracticalClass: "Stock audit — no class",
    status: "closed",
  },
  {
    id: "lab_013",
    name: "Language & Multimedia Lab",
    type: "Computer",
    block: "Arts Block, First Floor",
    capacity: 40,
    inCharge: "Meenakshi Iyer",
    assistant: "Sagar Kadam",
    equipmentTotal: 44,
    equipmentWorking: 38,
    weeklyPracticals: 6,
    nextPractical: "2026-07-27",
    nextPracticalClass: "VIII-A · Phonetics session",
    status: "operational",
  },
  {
    id: "lab_014",
    name: "Advanced Biotech Lab",
    type: "Biology",
    block: "Science Block, Second Floor",
    capacity: 20,
    inCharge: "Dr. Shobha Menon",
    assistant: "Pooja Salunke",
    equipmentTotal: 112,
    equipmentWorking: 88,
    weeklyPracticals: 4,
    nextPractical: "2026-08-01",
    nextPracticalClass: "XII-A · DNA extraction",
    status: "maintenance",
  },
];

export const labsApi = createResource<Lab, LabFilters>({
  idPrefix: "lab",
  seed,
  uniqueBy: { field: "name", label: "Lab name" },
  defaults: {
    capacity: 0,
    equipmentTotal: 0,
    equipmentWorking: 0,
    weeklyPracticals: 0,
    status: "operational",
  },
  matches: (row, { search, type, status }) => {
    if (type && row.type !== type) return false;
    if (status && row.status !== status) return false;
    return textMatch(search, row.name, row.inCharge, row.block, row.nextPracticalClass);
  },
});
