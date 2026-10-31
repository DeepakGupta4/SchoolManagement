import { api } from "./client";

/** One row of a grading scale (e.g. A1 = 91–100, GP 10). */
export interface GradingBand {
  grade: string;
  minPercent: number;
  maxPercent: number;
  gradePoint: number;
  remark: string;
}

/** A school's configurable grading scale for report cards. */
export interface GradingScheme {
  enabled: boolean;
  passPercent: number;
  bands: GradingBand[];
}

/** Admin-configured report card layout — the same for every student. */
export interface ReportCardTemplate {
  title: string;
  subtitle: string;
  footerNote: string;
  principalName: string;
  classTeacherLabel: string;
  showAttendance: boolean;
  showRank: boolean;
  showGradePoint: boolean;
  showRemarks: boolean;
  showSignatures: boolean;
}

export interface School {
  name: string;
  logo?: string;
  affiliation?: string;
  address?: string;
  city?: string;
  signatureUrl?: string;
  sessionLabel?: string;
  gradingScheme?: GradingScheme;
  reportCardTemplate?: ReportCardTemplate;
}

/** The signed-in user's school, including its grading scheme + report-card template. */
export const getMySchool = () => api<School>("/api/schools/mine");
