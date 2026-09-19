import { createApiResource } from "./createApiResource";
import { apiRequest } from "./client";

export type WorkflowTrigger =
  | "attendance_low"
  | "fee_overdue"
  | "birthday_today"
  | "admission_pending";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  enabled: boolean;
  threshold: number;
  runCount: number;
  lastRunAt: string;
}

export interface WorkflowFilters {
  search?: string;
  trigger?: string;
}

// runCount/lastRunAt are server-owned — callers never set them on create.
export const workflowsApi = createApiResource<
  Workflow,
  WorkflowFilters,
  "runCount" | "lastRunAt"
>("/api/workflows");

/** Summary returned when evaluating one or more rules. */
export interface RuleResult {
  name: string;
  message: string;
  notified?: boolean;
}

export interface RunSummary {
  ran: number;
  notified: number;
  results: RuleResult[];
}

/** Evaluate every enabled rule now. */
export function runAllWorkflows(): Promise<RunSummary> {
  return apiRequest<RunSummary>("/api/workflows/run-all", { method: "POST" });
}

/** Evaluate a single rule now. */
export function runWorkflow(id: string): Promise<RuleResult> {
  return apiRequest<RuleResult>(`/api/workflows/${id}/run`, { method: "POST" });
}

export const TRIGGER_OPTIONS: { label: string; value: WorkflowTrigger }[] = [
  { label: "Low attendance", value: "attendance_low" },
  { label: "Fee overdue", value: "fee_overdue" },
  { label: "Birthday today", value: "birthday_today" },
  { label: "Pending admissions", value: "admission_pending" },
];

export const TRIGGER_META: Record<WorkflowTrigger, { label: string; description: string }> = {
  attendance_low: {
    label: "Low attendance",
    description: "Alerts when active students fall below the attendance threshold.",
  },
  fee_overdue: {
    label: "Fee overdue",
    description: "Alerts when students have pending fees, with the total amount due.",
  },
  birthday_today: {
    label: "Birthday today",
    description: "Notifies you of students whose birthday is today so you can wish them.",
  },
  admission_pending: {
    label: "Pending admissions",
    description: "Alerts when admission applications are awaiting review.",
  },
};
