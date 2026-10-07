import { createApiResource } from "./createApiResource";

export type ApplicationStage = "applied" | "shortlisted" | "interview" | "hired" | "rejected";

export interface Application {
  id: string;
  /** The job posting's code this candidate applied to. */
  jobCode: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  appliedOn: string;
  /** One of APPLICATION_STAGES; kept as string so form/record types line up. */
  stage: string;
  note: string;
}

export interface ApplicationFilters {
  search?: string;
  stage?: string;
  jobCode?: string;
  /** Browse page size; raised above the 200 default so stats/export see all. */
  limit?: number;
}

export const APPLICATION_STAGES: ApplicationStage[] = [
  "applied",
  "shortlisted",
  "interview",
  "hired",
  "rejected",
];

export const STAGE_LABEL: Record<string, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export const applicationsApi = createApiResource<Application, ApplicationFilters>("/api/applications");
