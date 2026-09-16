import mongoose, { Schema, type InferSchemaType } from "mongoose";

const assignmentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: "" },
    class: { type: String, default: "" },
    teacher: { type: String, default: "" },
    given: { type: String, default: "" },
    due: { type: String, default: "" },
    totalMarks: { type: Number, default: 0 },
    submitted: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, default: "upcoming" },
    type: { type: String, default: "" },
  },
  { timestamps: true }
);

export type AssignmentAttrs = InferSchemaType<typeof assignmentSchema>;
export const Assignment = mongoose.model("Assignment", assignmentSchema);
