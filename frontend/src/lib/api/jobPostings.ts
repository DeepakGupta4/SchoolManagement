import { createApiResource } from "./createApiResource";

export interface JobPosting {
  id: string;
  /** Human-facing posting code, e.g. "JB001". Must stay unique. */
  code: string;
  title: string;
  dept: string;
  type: string;
  posted: string;
  deadline: string;
  applicants: number;
  status: string;
}

export interface JobPostingFilters {
  search?: string;
  dept?: string;
  status?: string;
}

export const JOB_DEPT_OPTIONS = ["Teaching", "IT", "Finance", "HR", "Security"];
export const JOB_TYPE_OPTIONS = ["Full-time", "Part-time"];
export const JOB_STATUS_OPTIONS = ["Open", "Closed"];

export const jobPostingsApi = createApiResource<JobPosting, JobPostingFilters>("/api/job-postings");
