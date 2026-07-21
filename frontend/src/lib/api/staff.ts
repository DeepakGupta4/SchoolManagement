import { createResource, textMatch } from "./createResource";

export interface StaffMember {
  id: string;
  /** Human-facing employee code, e.g. "ST001". Must stay unique. */
  employeeId: string;
  name: string;
  role: string;
  dept: string;
  type: string;
  status: string;
  phone: string;
  email: string;
  join: string;
  salary: number;
}

export interface StaffFilters {
  search?: string;
  dept?: string;
  type?: string;
  status?: string;
}

export const STAFF_DEPT_OPTIONS = [
  "Administration",
  "Finance",
  "HR",
  "IT",
  "Library",
  "Security",
  "Transport",
  "Health",
  "Canteen",
];

export const STAFF_TYPE_OPTIONS = ["Full-time", "Part-time"];

export const STAFF_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "On Leave", value: "on-leave" },
  { label: "Inactive", value: "inactive" },
];

const seed: StaffMember[] = [
  { id: "stf_001", employeeId: "ST001", name: "Mr. Rajesh Sharma", role: "Principal",         dept: "Administration", type: "Full-time", status: "active",   phone: "98765-11111", email: "rajesh@school.edu", join: "Jan 2015", salary: 85000 },
  { id: "stf_002", employeeId: "ST002", name: "Ms. Sunita Verma",  role: "Vice Principal",    dept: "Administration", type: "Full-time", status: "active",   phone: "98765-22222", email: "sunita@school.edu", join: "Mar 2017", salary: 72000 },
  { id: "stf_003", employeeId: "ST003", name: "Mr. Anil Kumar",    role: "Accountant",        dept: "Finance",        type: "Full-time", status: "active",   phone: "98765-33333", email: "anil@school.edu",   join: "Jun 2018", salary: 45000 },
  { id: "stf_004", employeeId: "ST004", name: "Ms. Pooja Mehta",   role: "HR Manager",        dept: "HR",             type: "Full-time", status: "active",   phone: "98765-44444", email: "pooja@school.edu",  join: "Aug 2019", salary: 50000 },
  { id: "stf_005", employeeId: "ST005", name: "Mr. Suresh Nair",   role: "IT Administrator",  dept: "IT",             type: "Full-time", status: "active",   phone: "98765-55555", email: "suresh@school.edu", join: "Feb 2020", salary: 55000 },
  { id: "stf_006", employeeId: "ST006", name: "Ms. Kavita Joshi",  role: "Librarian",         dept: "Library",        type: "Full-time", status: "on-leave", phone: "98765-66666", email: "kavita@school.edu", join: "Apr 2016", salary: 38000 },
  { id: "stf_007", employeeId: "ST007", name: "Mr. Deepak Singh",  role: "Security Head",     dept: "Security",       type: "Full-time", status: "active",   phone: "98765-77777", email: "deepak@school.edu", join: "Jan 2018", salary: 32000 },
  { id: "stf_008", employeeId: "ST008", name: "Ms. Anita Gupta",   role: "Receptionist",      dept: "Administration", type: "Full-time", status: "active",   phone: "98765-88888", email: "anita@school.edu",  join: "Sep 2021", salary: 28000 },
  { id: "stf_009", employeeId: "ST009", name: "Mr. Ramesh Patel",  role: "Transport Manager", dept: "Transport",      type: "Full-time", status: "active",   phone: "98765-99999", email: "ramesh@school.edu", join: "Jul 2017", salary: 42000 },
  { id: "stf_010", employeeId: "ST010", name: "Ms. Nisha Reddy",   role: "Nurse",             dept: "Health",         type: "Part-time", status: "active",   phone: "98765-10101", email: "nisha@school.edu",  join: "Mar 2022", salary: 25000 },
  { id: "stf_011", employeeId: "ST011", name: "Mr. Vinod Tiwari",  role: "Canteen Manager",   dept: "Canteen",        type: "Full-time", status: "active",   phone: "98765-11211", email: "vinod@school.edu",  join: "Nov 2019", salary: 30000 },
  { id: "stf_012", employeeId: "ST012", name: "Ms. Rekha Iyer",    role: "Counselor",         dept: "HR",             type: "Part-time", status: "inactive", phone: "98765-12121", email: "rekha@school.edu",  join: "Jan 2023", salary: 22000 },
];

const isAll = (value?: string) => !value || value === "All";

export const staffApi = createResource<StaffMember, StaffFilters>({
  idPrefix: "stf",
  seed,
  uniqueBy: { field: "employeeId", label: "Employee ID" },
  defaults: { status: "active", salary: 0 },
  matches: (row, { search, dept, type, status }) => {
    if (!isAll(dept) && row.dept !== dept) return false;
    if (!isAll(type) && row.type !== type) return false;
    if (!isAll(status) && row.status !== status) return false;
    return textMatch(search, row.name, row.role, row.employeeId, row.email);
  },
});
