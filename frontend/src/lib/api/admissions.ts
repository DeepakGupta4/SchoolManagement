import { createApiResource } from "./createApiResource";

export interface Application {
  id: string;
  applicationNo: string;
  name: string;
  classApplied: string;
  parent: string;
  phone: string;
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

export const CLASS_APPLIED_OPTIONS = ["Class 1", "Class 4", "Class 6", "Class 9", "Class 11"];

export const SOURCE_OPTIONS = ["Walk-in", "Website", "Referral", "Fair"];

/** The next stage an application can be advanced to, or null at the end. */
export function nextStage(stage: string): string | null {
  const order = ["enquiry", "applied", "interview", "approved"];
  const at = order.indexOf(stage);
  if (at === -1 || at === order.length - 1) return null;
  return order[at + 1];
}

export const admissionsApi = createApiResource<Application, ApplicationFilters>("/api/admissions");
