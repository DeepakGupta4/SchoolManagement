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

export type DepartmentAttrs = InferSchemaType<typeof departmentSchema>;
export const Department = mongoose.model("Department", departmentSchema);
