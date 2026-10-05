import mongoose, { Schema, type InferSchemaType } from "mongoose";

const jobPostingSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    dept: { type: String, default: "" },
    type: { type: String, default: "" },
    posted: { type: String, default: "" },
    deadline: { type: String, default: "" },
    applicants: { type: Number, default: 0 },
    status: { type: String, default: "Open" },
  },
  { timestamps: true }
);

// Job codes must be unique within a school (claimed in the UI; enforced here).
jobPostingSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export type JobPostingAttrs = InferSchemaType<typeof jobPostingSchema>;
export const JobPosting = mongoose.model("JobPosting", jobPostingSchema);
