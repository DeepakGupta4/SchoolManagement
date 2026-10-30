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

export interface School {
  name: string;
  logo?: string;
  gradingScheme?: GradingScheme;
}

/** The signed-in user's school, including its grading scheme. */
export const getMySchool = () => api<School>("/api/schools/mine");
