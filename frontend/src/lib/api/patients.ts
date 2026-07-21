import { createResource, textMatch } from "./createResource";

export interface Patient {
  id: string;
  /** Human-facing patient reference shown in the UI, e.g. "P001". The `id` is
   *  internal and must never be displayed. */
  code: string;
  name: string;
  /** Class and section, e.g. "10-A". "—" for staff. */
  class: string;
  issue: string;
  status: string;
  /** Visit date, e.g. "12 Jul 2025". */
  date: string;
  doctor: string;
  type: string;
}

export interface PatientFilters {
  search?: string;
  /** "All" (or empty) means every status. */
  status?: string;
  /** "All" (or empty) means every type. */
  type?: string;
}

export const PATIENT_STATUS_OPTIONS = ["Recovered", "Under Treatment", "Referred"];

export const PATIENT_TYPE_OPTIONS = ["Student", "Staff"];

export const PATIENT_DOCTOR_OPTIONS = ["Dr. Mehta", "Dr. Singh", "Dr. Kapoor"];

const seed: Patient[] = [
  { id: "pat_001", code: "P001", name: "Aarav Sharma", class: "10-A", issue: "Fever", status: "Recovered", date: "12 Jul 2025", doctor: "Dr. Mehta", type: "Student" },
  { id: "pat_002", code: "P002", name: "Priya Patel", class: "9-B", issue: "Sprained Ankle", status: "Under Treatment", date: "14 Jul 2025", doctor: "Dr. Mehta", type: "Student" },
  { id: "pat_003", code: "P003", name: "Rohan Verma", class: "11-A", issue: "Headache", status: "Recovered", date: "10 Jul 2025", doctor: "Dr. Singh", type: "Student" },
  { id: "pat_004", code: "P004", name: "Sneha Gupta", class: "8-C", issue: "Stomach Ache", status: "Referred", date: "15 Jul 2025", doctor: "Dr. Mehta", type: "Student" },
  { id: "pat_005", code: "P005", name: "Karan Singh", class: "12-B", issue: "Eye Infection", status: "Under Treatment", date: "13 Jul 2025", doctor: "Dr. Singh", type: "Student" },
  { id: "pat_006", code: "P006", name: "Mr. Ramesh", class: "—", issue: "BP Check", status: "Recovered", date: "11 Jul 2025", doctor: "Dr. Mehta", type: "Staff" },
  { id: "pat_007", code: "P007", name: "Ananya Joshi", class: "7-A", issue: "Allergy", status: "Under Treatment", date: "15 Jul 2025", doctor: "Dr. Singh", type: "Student" },
  { id: "pat_008", code: "P008", name: "Vikram Nair", class: "6-B", issue: "Cold & Cough", status: "Recovered", date: "09 Jul 2025", doctor: "Dr. Mehta", type: "Student" },
];

export const patientsApi = createResource<Patient, PatientFilters, "code">({
  idPrefix: "pat",
  seed,
  // Patient references continue the seed sequence rather than restarting.
  generate: (count) => ({ code: `P${String(count + 1).padStart(3, "0")}` }),
  defaults: { status: "Under Treatment", type: "Student", class: "—" },
  matches: (row, { search, status, type }) => {
    if (status && status !== "All" && row.status !== status) return false;
    if (type && type !== "All" && row.type !== type) return false;
    return textMatch(search, row.name, row.issue, row.code, row.doctor, row.class);
  },
});
