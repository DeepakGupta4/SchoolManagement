import { createResource, textMatch } from "./createResource";

export interface HostelStudent {
  id: string;
  /** School-facing admission code, e.g. "S001". Shown under the name. */
  studentId: string;
  name: string;
  class: string;
  hostel: string;
  room: string;
  type: string;
  fees: string;
  joinDate: string;
  contact: string;
}

export interface HostelStudentFilters {
  search?: string;
  /** "All" | "Boys" | "Girls" — mirrors the page tabs. */
  type?: string;
  hostel?: string;
  fees?: string;
}

export const HOSTEL_OPTIONS = [
  "Boys Hostel A",
  "Boys Hostel B",
  "Girls Hostel A",
  "Girls Hostel B",
];

export const HOSTEL_TYPE_OPTIONS = ["Boys", "Girls"];

export const FEE_STATUS_OPTIONS = ["Paid", "Pending", "Overdue"];

const seed: HostelStudent[] = [
  { id: "hs_001", studentId: "S001", name: "Aarav Sharma", class: "10-A", hostel: "Boys Hostel A",  room: "A-101",  type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "98765-XXXXX" },
  { id: "hs_002", studentId: "S002", name: "Rohan Verma",  class: "9-B",  hostel: "Boys Hostel A",  room: "A-102",  type: "Boys",  fees: "Pending", joinDate: "Apr 2025", contact: "87654-XXXXX" },
  { id: "hs_003", studentId: "S003", name: "Karan Singh",  class: "11-A", hostel: "Boys Hostel B",  room: "B-201",  type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "76543-XXXXX" },
  { id: "hs_004", studentId: "S004", name: "Vikram Nair",  class: "8-A",  hostel: "Boys Hostel B",  room: "B-105",  type: "Boys",  fees: "Overdue", joinDate: "Jan 2025", contact: "65432-XXXXX" },
  { id: "hs_005", studentId: "S005", name: "Priya Patel",  class: "10-A", hostel: "Girls Hostel A", room: "G-301",  type: "Girls", fees: "Paid",    joinDate: "Apr 2025", contact: "54321-XXXXX" },
  { id: "hs_006", studentId: "S006", name: "Sneha Gupta",  class: "11-C", hostel: "Girls Hostel A", room: "G-302",  type: "Girls", fees: "Paid",    joinDate: "Apr 2025", contact: "43210-XXXXX" },
  { id: "hs_007", studentId: "S007", name: "Ananya Joshi", class: "12-B", hostel: "Girls Hostel A", room: "G-401",  type: "Girls", fees: "Paid",    joinDate: "Jan 2025", contact: "32109-XXXXX" },
  { id: "hs_008", studentId: "S008", name: "Meera Iyer",   class: "6-B",  hostel: "Girls Hostel B", room: "GB-101", type: "Girls", fees: "Pending", joinDate: "Apr 2025", contact: "21098-XXXXX" },
  { id: "hs_009", studentId: "S009", name: "Arjun Reddy",  class: "9-A",  hostel: "Boys Hostel A",  room: "A-205",  type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "11987-XXXXX" },
  { id: "hs_010", studentId: "S010", name: "Pooja Mishra", class: "10-B", hostel: "Girls Hostel B", room: "GB-202", type: "Girls", fees: "Overdue", joinDate: "Jan 2025", contact: "10876-XXXXX" },
];

export const hostelStudentsApi = createResource<HostelStudent, HostelStudentFilters>({
  idPrefix: "hs",
  seed,
  // One bed per room in this hostel model, so the room doubles as the allocation key.
  uniqueBy: { field: "room", label: "Room no." },
  defaults: { fees: "Pending", joinDate: "Apr 2025" },
  matches: (row, { search, type, hostel, fees }) => {
    if (type && type !== "All" && row.type !== type) return false;
    if (hostel && hostel !== "All" && row.hostel !== hostel) return false;
    if (fees && fees !== "All" && row.fees !== fees) return false;
    return textMatch(search, row.name, row.studentId, row.room);
  },
});
