import mongoose, { Schema, type InferSchemaType } from "mongoose";

const subjectSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, default: "" },
    department: { type: String, default: "" },
    type: { type: String, default: "Core" },
  },
  { timestamps: true }
);

export type SubjectAttrs = InferSchemaType<typeof subjectSchema>;
export const Subject = mongoose.model("Subject", subjectSchema);
