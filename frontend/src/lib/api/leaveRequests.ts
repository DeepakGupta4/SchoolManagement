import { createResource, textMatch } from "./createResource";

export interface LeaveRequest {
  id: string;
  /** Human-facing request code, e.g. "LV001". Must stay unique. */
  code: string;
  name: string;
  role: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: string;
  dept: string;
}

export interface LeaveFilters {
  search?: string;
  status?: string;
  type?: string;
}

export const LEAVE_TYPE_OPTIONS = [
  "Sick Leave",
  "Casual Leave",
  "Earned Leave",
  "Maternity Leave",
];

export const LEAVE_STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

export const LEAVE_DEPT_OPTIONS = [
  "Teaching",
  "Administration",
  "Finance",
  "HR",
  "Library",
  "Security",
  "Canteen",
  "Transport",
];

const seed: LeaveRequest[] = [
  { id: "lv_001", code: "LV001", name: "Mr. Suresh Kumar", role: "History Teacher", type: "Sick Leave",     from: "14 Jul 2025", to: "16 Jul 2025", days: 3,  reason: "Fever and cold",   status: "Pending",  dept: "Teaching" },
  { id: "lv_002", code: "LV002", name: "Ms. Kavita Joshi", role: "Librarian",       type: "Casual Leave",   from: "18 Jul 2025", to: "18 Jul 2025", days: 1,  reason: "Personal work",    status: "Approved", dept: "Library" },
  { id: "lv_003", code: "LV003", name: "Mr. Anil Kumar",   role: "Accountant",      type: "Earned Leave",   from: "21 Jul 2025", to: "25 Jul 2025", days: 5,  reason: "Family function",  status: "Approved", dept: "Finance" },
  { id: "lv_004", code: "LV004", name: "Ms. Rekha Iyer",   role: "Counselor",       type: "Sick Leave",     from: "10 Jul 2025", to: "11 Jul 2025", days: 2,  reason: "Medical checkup",  status: "Rejected", dept: "HR" },
  { id: "lv_005", code: "LV005", name: "Mr. Deepak Singh", role: "Security Head",   type: "Casual Leave",   from: "20 Jul 2025", to: "20 Jul 2025", days: 1,  reason: "Personal",         status: "Pending",  dept: "Security" },
  { id: "lv_006", code: "LV006", name: "Dr. Priya Sharma", role: "Math Teacher",    type: "Maternity Leave",from: "01 Aug 2025", to: "30 Oct 2025", days: 90, reason: "Maternity",        status: "Approved", dept: "Teaching" },
  { id: "lv_007", code: "LV007", name: "Mr. Rahul Verma",  role: "Physics Teacher", type: "Earned Leave",   from: "28 Jul 2025", to: "30 Jul 2025", days: 3,  reason: "Vacation",         status: "Pending",  dept: "Teaching" },
  { id: "lv_008", code: "LV008", name: "Ms. Anita Gupta",  role: "Receptionist",    type: "Sick Leave",     from: "15 Jul 2025", to: "15 Jul 2025", days: 1,  reason: "Not feeling well", status: "Approved", dept: "Administration" },
  { id: "lv_009", code: "LV009", name: "Mr. Vinod Tiwari", role: "Canteen Manager", type: "Casual Leave",   from: "22 Jul 2025", to: "22 Jul 2025", days: 1,  reason: "Personal work",    status: "Pending",  dept: "Canteen" },
  { id: "lv_010", code: "LV010", name: "Ms. Pooja Mehta",  role: "HR Manager",      type: "Earned Leave",   from: "04 Aug 2025", to: "08 Aug 2025", days: 5,  reason: "Annual vacation",  status: "Approved", dept: "HR" },
];

const isAll = (value?: string) => !value || value === "All";

export const leaveRequestsApi = createResource<LeaveRequest, LeaveFilters>({
  idPrefix: "lv",
  seed,
  uniqueBy: { field: "code", label: "Request ID" },
  defaults: { status: "Pending", days: 1 },
  matches: (row, { search, status, type }) => {
    if (!isAll(status) && row.status !== status) return false;
    if (!isAll(type) && row.type !== type) return false;
    return textMatch(search, row.name, row.code, row.dept, row.role);
  },
});
