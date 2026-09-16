import mongoose, { Schema, type InferSchemaType } from "mongoose";

const scholarshipSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    student: { type: String, required: true, trim: true },
    class: { type: String, default: "" },
    type: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    reason: { type: String, default: "" },
    status: { type: String, default: "pending" },
    since: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ScholarshipAttrs = InferSchemaType<typeof scholarshipSchema>;
export const Scholarship = mongoose.model("Scholarship", scholarshipSchema);
