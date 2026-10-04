import mongoose, { Schema, type InferSchemaType } from "mongoose";

const departmentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    hod: { type: String, default: "" },
    block: { type: String, default: "" },
    teachers: { type: Number, default: 0 },
    subjects: { type: [String], default: [] },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

// Code and name are each unique within a school (the form promises a unique
// code). Dedupe any existing clashes before deploying, or the index build fails.
departmentSchema.index({ schoolId: 1, code: 1 }, { unique: true });
departmentSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export type DepartmentAttrs = InferSchemaType<typeof departmentSchema>;
export const Department = mongoose.model("Department", departmentSchema);
