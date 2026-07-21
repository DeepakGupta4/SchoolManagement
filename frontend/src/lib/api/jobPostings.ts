import { createResource, textMatch } from "./createResource";

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

const seed: JobPosting[] = [
  { id: "job_001", code: "JB001", title: "Mathematics Teacher", dept: "Teaching", type: "Full-time", posted: "01 Jul 2025", deadline: "31 Jul 2025", applicants: 18, status: "Open" },
  { id: "job_002", code: "JB002", title: "Physics Teacher",     dept: "Teaching", type: "Full-time", posted: "05 Jul 2025", deadline: "05 Aug 2025", applicants: 12, status: "Open" },
  { id: "job_003", code: "JB003", title: "IT Administrator",    dept: "IT",       type: "Full-time", posted: "20 Jun 2025", deadline: "20 Jul 2025", applicants: 25, status: "Closed" },
  { id: "job_004", code: "JB004", title: "Accountant",          dept: "Finance",  type: "Full-time", posted: "10 Jul 2025", deadline: "10 Aug 2025", applicants: 9,  status: "Open" },
  { id: "job_005", code: "JB005", title: "School Counselor",    dept: "HR",       type: "Part-time", posted: "12 Jul 2025", deadline: "12 Aug 2025", applicants: 7,  status: "Open" },
  { id: "job_006", code: "JB006", title: "Security Guard",      dept: "Security", type: "Full-time", posted: "15 Jun 2025", deadline: "15 Jul 2025", applicants: 30, status: "Closed" },
];

const isAll = (value?: string) => !value || value === "All";

export const jobPostingsApi = createResource<JobPosting, JobPostingFilters>({
  idPrefix: "job",
  seed,
  uniqueBy: { field: "code", label: "Job code" },
  defaults: { applicants: 0, status: "Open" },
  matches: (row, { search, dept, status }) => {
    if (!isAll(dept) && row.dept !== dept) return false;
    // Applicant statuses share the filter control, so an unrelated value
    // (e.g. "Shortlisted") must not silently match every posting.
    if (!isAll(status) && row.status !== status) return false;
    return textMatch(search, row.title, row.code, row.dept);
  },
});
