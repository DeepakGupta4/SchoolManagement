import { createApiResource } from "./createApiResource";

export interface Application {
  id: string;
  // Applicant
  applicationNo: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  classApplied: string;
  bloodGroup: string;
  category: string;
  previousSchool: string;
  // Parent / guardian & contact
  parent: string;
  relation: string;
  phone: string;
  email: string;
  address: string;
  // Admission process
  source: string;
  appliedOn: string;
  stage: string;
  score: number;
  notes: string;
}

export interface ApplicationFilters {
  search?: string;
  stage?: string;
  classApplied?: string;
  source?: string;
}

/** Ordered funnel. Everything before "rejected" is a forward-moving stage. */
export const PIPELINE = ["enquiry", "applied", "interview", "approved", "rejected"] as const;

export const STAGE_META: Record<
  string,
  { label: string; variant: "default" | "info" | "warning" | "success" | "danger" }
> = {
  enquiry: { label: "Enquiry", variant: "default" },
  applied: { label: "Applied", variant: "info" },
  interview: { label: "Interview", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

export const STAGE_OPTIONS = PIPELINE.map((s) => ({ label: STAGE_META[s].label, value: s }));

export const CLASS_APPLIED_OPTIONS = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

export const SOURCE_OPTIONS = ["Walk-in", "Website", "Referral", "Fair", "Advertisement", "Social Media"];

export const GENDER_OPTIONS = ["Male", "Female", "Other"];

export const RELATION_OPTIONS = ["Father", "Mother", "Guardian"];

export const CATEGORY_OPTIONS = ["General", "OBC", "SC", "ST", "EWS"];

export const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

/** The next stage an application can be advanced to, or null at the end. */
export function nextStage(stage: string): string | null {
  const order = ["enquiry", "applied", "interview", "approved"];
  const at = order.indexOf(stage);
  if (at === -1 || at === order.length - 1) return null;
  return order[at + 1];
}

/** A fresh, likely-unique application number, e.g. ADM-2026-0483. */
export function generateApplicationNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ADM-${year}-${rand}`;
}

export const admissionsApi = createApiResource<Application, ApplicationFilters>("/api/admissions");
