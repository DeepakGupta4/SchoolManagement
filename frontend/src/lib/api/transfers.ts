import { createResource, textMatch } from "./createResource";

export interface TransferRequest {
  id: string;
  tcNo: string;
  name: string;
  studentId: string;
  className: string;
  type: string;
  reason: string;
  requestedOn: string;
  issuedOn: string;
  status: string;
  dues: number;
}

export interface TransferFilters {
  search?: string;
  status?: string;
  type?: string;
}

export const STATUS_META: Record<
  string,
  { label: string; variant: "warning" | "info" | "success" | "danger" }
> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "info" },
  issued: { label: "TC Issued", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, m]) => ({
  label: m.label,
  value,
}));

export const TYPE_OPTIONS = [
  { label: "Transfer", value: "transfer" },
  { label: "Withdrawal", value: "withdrawal" },
];

export const CLASS_OPTIONS = [
  "2-B", "3-A", "4-A", "5-B", "6-A", "6-B", "7-A", "8-A", "8-C",
  "9-A", "9-B", "10-A", "10-B", "11-A", "11-B", "12-A",
];

const seed: TransferRequest[] = [
  { id: "TC-2026-001", tcNo: "TC/2026/0041", name: "Aarav Sharma",    studentId: "STU-0901", className: "9-A",  type: "transfer",   reason: "Parent relocation to Pune",        requestedOn: "2026-01-08", issuedOn: "2026-01-15", status: "issued",   dues: 0 },
  { id: "TC-2026-002", tcNo: "—",            name: "Diya Nair",       studentId: "STU-0902", className: "6-B",  type: "withdrawal", reason: "Shifting to state board school",   requestedOn: "2026-01-11", issuedOn: "—",          status: "pending",  dues: 4200 },
  { id: "TC-2026-003", tcNo: "TC/2026/0042", name: "Kabir Malhotra",  studentId: "STU-0903", className: "11-A", type: "transfer",   reason: "Father's job transfer to Chennai", requestedOn: "2026-01-12", issuedOn: "2026-01-19", status: "issued",   dues: 0 },
  { id: "TC-2026-004", tcNo: "—",            name: "Ananya Iyer",     studentId: "STU-0904", className: "4-A",  type: "withdrawal", reason: "Medical — long term treatment",    requestedOn: "2026-01-14", issuedOn: "—",          status: "approved", dues: 0 },
  { id: "TC-2026-005", tcNo: "—",            name: "Vivaan Reddy",    studentId: "STU-0905", className: "8-C",  type: "transfer",   reason: "Seeking residential school",       requestedOn: "2026-01-16", issuedOn: "—",          status: "rejected", dues: 9800 },
  { id: "TC-2026-006", tcNo: "TC/2026/0043", name: "Ishita Banerjee", studentId: "STU-0906", className: "10-A", type: "transfer",   reason: "Family moving to Kolkata",         requestedOn: "2026-01-17", issuedOn: "2026-01-24", status: "issued",   dues: 0 },
  { id: "TC-2026-007", tcNo: "—",            name: "Reyansh Gupta",   studentId: "STU-0907", className: "2-B",  type: "withdrawal", reason: "Financial constraints",            requestedOn: "2026-01-19", issuedOn: "—",          status: "pending",  dues: 6500 },
  { id: "TC-2026-008", tcNo: "TC/2026/0044", name: "Saanvi Patil",    studentId: "STU-0908", className: "12-A", type: "transfer",   reason: "Admission in Navodaya Vidyalaya",  requestedOn: "2026-01-20", issuedOn: "2026-01-27", status: "issued",   dues: 0 },
  { id: "TC-2026-009", tcNo: "—",            name: "Arjun Chauhan",   studentId: "STU-0909", className: "7-A",  type: "transfer",   reason: "Relocation to Hyderabad",          requestedOn: "2026-01-22", issuedOn: "—",          status: "approved", dues: 0 },
  { id: "TC-2026-010", tcNo: "—",            name: "Myra Joshi",      studentId: "STU-0910", className: "5-B",  type: "withdrawal", reason: "Home schooling",                   requestedOn: "2026-01-23", issuedOn: "—",          status: "pending",  dues: 1500 },
  { id: "TC-2026-011", tcNo: "TC/2026/0045", name: "Advik Deshmukh",  studentId: "STU-0911", className: "9-B",  type: "transfer",   reason: "Parent posting to Nagpur",         requestedOn: "2026-01-25", issuedOn: "2026-02-01", status: "issued",   dues: 0 },
  { id: "TC-2026-012", tcNo: "—",            name: "Kiara Menon",     studentId: "STU-0912", className: "3-A",  type: "withdrawal", reason: "Moving abroad — Dubai",            requestedOn: "2026-01-27", issuedOn: "—",          status: "approved", dues: 0 },
  { id: "TC-2026-013", tcNo: "—",            name: "Atharv Rathore",  studentId: "STU-0913", className: "11-B", type: "transfer",   reason: "Change of stream to Commerce",     requestedOn: "2026-01-29", issuedOn: "—",          status: "rejected", dues: 0 },
  { id: "TC-2026-014", tcNo: "TC/2026/0046", name: "Aadhya Kulkarni", studentId: "STU-0914", className: "6-A",  type: "transfer",   reason: "Family moving to Bengaluru",       requestedOn: "2026-02-02", issuedOn: "2026-02-09", status: "issued",   dues: 0 },
  { id: "TC-2026-015", tcNo: "—",            name: "Vihaan Saxena",   studentId: "STU-0915", className: "8-A",  type: "withdrawal", reason: "Personal / family reasons",        requestedOn: "2026-02-04", issuedOn: "—",          status: "pending",  dues: 3300 },
  { id: "TC-2026-016", tcNo: "—",            name: "Anika Bhatt",     studentId: "STU-0916", className: "10-B", type: "transfer",   reason: "Relocation to Jaipur",             requestedOn: "2026-02-06", issuedOn: "—",          status: "approved", dues: 0 },
];

export const transfersApi = createResource<TransferRequest, TransferFilters>({
  idPrefix: "tc",
  seed,
  uniqueBy: { field: "studentId", label: "Student ID" },
  defaults: { tcNo: "—", issuedOn: "—", status: "pending", dues: 0 },
  matches: (row, { search, status, type }) => {
    if (status && row.status !== status) return false;
    if (type && row.type !== type) return false;
    return textMatch(search, row.name, row.studentId, row.tcNo, row.reason);
  },
});
