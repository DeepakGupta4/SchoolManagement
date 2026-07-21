import { createResource, textMatch } from "./createResource";

export type VisitorPurpose =
  | "Parent meeting"
  | "Admission enquiry"
  | "Vendor / delivery"
  | "Maintenance"
  | "Student pickup"
  | "Official inspection";

export type VisitorStatus = "inside" | "checked-out" | "expected";

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: VisitorPurpose;
  whomToMeet: string;
  inTime: string;
  outTime: string | null;
  passCode: string;
  status: VisitorStatus;
  /** Set when the visitor is authorised to collect a student at the gate. */
  pickupFor: string | null;
}

export interface VisitorFilters {
  search?: string;
  purpose?: string;
  status?: string;
}

export const VISITOR_PURPOSE_OPTIONS: { label: string; value: VisitorPurpose }[] = [
  { label: "Parent meeting", value: "Parent meeting" },
  { label: "Admission enquiry", value: "Admission enquiry" },
  { label: "Vendor / delivery", value: "Vendor / delivery" },
  { label: "Maintenance", value: "Maintenance" },
  { label: "Student pickup", value: "Student pickup" },
  { label: "Official inspection", value: "Official inspection" },
];

export const VISITOR_STATUS_OPTIONS: { label: string; value: VisitorStatus }[] = [
  { label: "Inside", value: "inside" },
  { label: "Checked out", value: "checked-out" },
  { label: "Expected", value: "expected" },
];

/** "09:12" — 24-hour gate-log format. */
export const currentTime = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Gate passes avoid I/O/1/0 so guards can read them off a printed slip. */
export const makePassCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `GP-${code}`;
};

const seed: Visitor[] = [
  {
    id: "vis_001",
    name: "Ramesh Kulkarni",
    phone: "+91 98220 41277",
    purpose: "Parent meeting",
    whomToMeet: "Meenakshi Iyer (Class Teacher, VIII-A)",
    inTime: "09:12",
    outTime: "10:05",
    passCode: "GP-4A19KD",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "vis_002",
    name: "Sunita Deshpande",
    phone: "+91 99700 33812",
    purpose: "Student pickup",
    whomToMeet: "Gate Security Desk",
    inTime: "13:40",
    outTime: "13:58",
    passCode: "GP-7X02LM",
    status: "checked-out",
    pickupFor: "Aarav Deshpande (VI-B)",
  },
  {
    id: "vis_003",
    name: "Imran Shaikh",
    phone: "+91 90280 55491",
    purpose: "Vendor / delivery",
    whomToMeet: "Stores Department",
    inTime: "10:22",
    outTime: null,
    passCode: "GP-2M84QP",
    status: "inside",
    pickupFor: null,
  },
  {
    id: "vis_004",
    name: "Dr. Anita Rao",
    phone: "+91 98450 71203",
    purpose: "Official inspection",
    whomToMeet: "Principal's Office",
    inTime: "11:05",
    outTime: null,
    passCode: "GP-9F51TR",
    status: "inside",
    pickupFor: null,
  },
  {
    id: "vis_005",
    name: "Vikas Chaudhary",
    phone: "+91 87930 22106",
    purpose: "Admission enquiry",
    whomToMeet: "Admissions Counter",
    inTime: "09:48",
    outTime: "10:36",
    passCode: "GP-6C37VN",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "vis_006",
    name: "Lakshmi Narayanan",
    phone: "+91 96320 88014",
    purpose: "Parent meeting",
    whomToMeet: "Priya Ramanathan (HOD Mathematics)",
    inTime: "12:15",
    outTime: null,
    passCode: "GP-1B60WS",
    status: "inside",
    pickupFor: null,
  },
  {
    id: "vis_007",
    name: "Prakash Jadhav",
    phone: "+91 91580 46722",
    purpose: "Maintenance",
    whomToMeet: "Facilities Manager",
    inTime: "08:30",
    outTime: "14:10",
    passCode: "GP-3H29YU",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "vis_008",
    name: "Fatima Ansari",
    phone: "+91 99870 13455",
    purpose: "Student pickup",
    whomToMeet: "Gate Security Desk",
    inTime: "14:02",
    outTime: null,
    passCode: "GP-8K73ZA",
    status: "inside",
    pickupFor: "Zoya Ansari (IV-C)",
  },
  {
    id: "vis_009",
    name: "Gurpreet Singh",
    phone: "+91 98110 60934",
    purpose: "Vendor / delivery",
    whomToMeet: "Canteen Supervisor",
    inTime: "07:55",
    outTime: "08:40",
    passCode: "GP-5N18EQ",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "vis_010",
    name: "Neha Bhatt",
    phone: "+91 97640 29587",
    purpose: "Admission enquiry",
    whomToMeet: "Admissions Counter",
    inTime: "15:20",
    outTime: null,
    passCode: "GP-0J45RB",
    status: "expected",
    pickupFor: null,
  },
  {
    id: "vis_011",
    name: "Santosh Pawar",
    phone: "+91 94220 77340",
    purpose: "Parent meeting",
    whomToMeet: "Rajesh Nair (Sports Head)",
    inTime: "11:48",
    outTime: "12:22",
    passCode: "GP-4T91CX",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "vis_012",
    name: "Meera Krishnan",
    phone: "+91 98404 51166",
    purpose: "Student pickup",
    whomToMeet: "Gate Security Desk",
    inTime: "15:05",
    outTime: null,
    passCode: "GP-7Q26DF",
    status: "inside",
    pickupFor: "Nikhil Krishnan (IX-A)",
  },
  {
    id: "vis_013",
    name: "Abdul Rehman",
    phone: "+91 90040 38729",
    purpose: "Maintenance",
    whomToMeet: "IT Support (Computer Lab)",
    inTime: "10:50",
    outTime: null,
    passCode: "GP-2W83GH",
    status: "inside",
    pickupFor: null,
  },
  {
    id: "vis_014",
    name: "Jyoti Sharma",
    phone: "+91 99530 64218",
    purpose: "Official inspection",
    whomToMeet: "Vice Principal",
    inTime: "16:00",
    outTime: null,
    passCode: "GP-6L07JK",
    status: "expected",
    pickupFor: null,
  },
  {
    id: "vis_015",
    name: "Deepak Wagh",
    phone: "+91 88880 92451",
    purpose: "Vendor / delivery",
    whomToMeet: "Library Desk",
    inTime: "09:05",
    outTime: "09:31",
    passCode: "GP-3Z54MN",
    status: "checked-out",
    pickupFor: null,
  },
];

export const visitorsApi = createResource<Visitor, VisitorFilters>({
  idPrefix: "vis",
  seed,
  uniqueBy: { field: "passCode", label: "Gate pass" },
  defaults: { status: "inside", outTime: null, pickupFor: null },
  matches: (row, { search, purpose, status }) => {
    if (purpose && row.purpose !== purpose) return false;
    if (status && row.status !== status) return false;
    return textMatch(search, row.name, row.phone, row.whomToMeet, row.passCode);
  },
});
