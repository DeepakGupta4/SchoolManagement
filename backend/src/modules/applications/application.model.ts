import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A job application — a candidate against a job posting, moving through a hiring
 * pipeline. Linked to the posting by `jobCode` (the posting's human code), since
 * postings are identified that way across the app.
 */
export const APPLICATION_STAGES = ["applied", "shortlisted", "interview", "hired", "rejected"] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

const applicationSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    jobCode: { type: String, default: "", index: true },
    jobTitle: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "" },
    experience: { type: String, default: "" },
    appliedOn: { type: String, default: "" }, // YYYY-MM-DD
    stage: { type: String, enum: APPLICATION_STAGES, default: "applied", index: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ApplicationAttrs = InferSchemaType<typeof applicationSchema>;
// NOTE: model name MUST stay unique. The admissions module registers a model
// named "Application" too (student admission applications); sharing the name
// crashes boot with OverwriteModelError and would also collide on the default
// `applications` collection. This ATS model is "JobApplication" on its own
// `jobapplications` collection so the two never clash.
export const Application = mongoose.model("JobApplication", applicationSchema, "jobapplications");
