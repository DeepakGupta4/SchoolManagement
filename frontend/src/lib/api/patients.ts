import { createApiResource } from "./createApiResource";

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

export const patientsApi = createApiResource<Patient, PatientFilters, "code">("/api/patients");
