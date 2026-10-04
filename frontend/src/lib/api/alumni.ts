import { apiRequest } from "./client";
import { createApiResource } from "./createApiResource";
import { TODAY_ISO } from "@/lib/dates";

export interface Alumnus {
  id: string;
  /** Source student's admission no. when imported from graduates; "" otherwise. */
  studentId: string;
  name: string;
  batch: string;
  stream: string;
  occupation: string;
  employer: string;
  city: string;
  email: string;
  phone: string;
  mentor: boolean;
  interests: string[];
}

export interface AlumniFilters {
  search?: string;
  batch?: string;
  stream?: string;
  city?: string;
  /** Browse page size; raised from the 200 default so stats/filters see more. */
  limit?: number;
}

const CURRENT_YEAR = Number(TODAY_ISO.slice(0, 4));
/** Recent passing-out years, newest first — derived from today so it never goes stale. */
export const BATCH_OPTIONS = Array.from({ length: 20 }, (_, i) => String(CURRENT_YEAR - i));

export const STREAM_OPTIONS = ["Science", "Commerce", "Arts"];

export const CITY_OPTIONS = [
  "Bengaluru", "Chennai", "Gurugram", "Guwahati", "Hyderabad",
  "Jaipur", "Jamshedpur", "Mumbai", "New Delhi", "Pune",
];

/** What an alumnus is willing to help the school with. */
export const INTEREST_OPTIONS = [
  "Career talks",
  "Mock interviews",
  "Internships",
  "Scholarship fund",
  "Alumni meet",
];

export const alumniApi = createApiResource<Alumnus, AlumniFilters>("/api/alumni");

/** Pulls graduated students (status "alumni") into the directory. Idempotent. */
export async function importGraduates(): Promise<{ imported: number; skipped: number }> {
  return apiRequest<{ imported: number; skipped: number }>("/api/alumni/import-graduates", {
    method: "POST",
  });
}
