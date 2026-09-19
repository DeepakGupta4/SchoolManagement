import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A single automation rule. Each rule pairs a trigger (a condition evaluated
 * against live tenant data) with the implicit action of posting an in-app
 * notification when that condition matches. Rules are evaluated on demand
 * ("Run") and periodically by the server sweep (auto), which dedupes on
 * `lastRunAt` so a school isn't spammed with the same alert every few hours.
 */
export const WORKFLOW_TRIGGERS = [
  "attendance_low",
  "fee_overdue",
  "birthday_today",
  "admission_pending",
] as const;
export type WorkflowTrigger = (typeof WORKFLOW_TRIGGERS)[number];

const workflowSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    trigger: { type: String, enum: WORKFLOW_TRIGGERS, required: true },
    enabled: { type: Boolean, default: true },
    /** Attendance percentage cut-off used by the `attendance_low` trigger. */
    threshold: { type: Number, default: 75 },
    runCount: { type: Number, default: 0 },
    lastRunAt: { type: String, default: "" },
  },
  { timestamps: true }
);

export type WorkflowAttrs = InferSchemaType<typeof workflowSchema>;
export const Workflow = mongoose.model("Workflow", workflowSchema);
