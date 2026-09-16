import mongoose, { Schema, type InferSchemaType } from "mongoose";

const allocationSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    teacher: { type: String, required: true, trim: true },
    empId: { type: String, default: "" },
    dept: { type: String, default: "" },
    subject: { type: String, default: "" },
    classes: { type: [String], default: [] },
    periods: { type: Number, default: 0 },
    labs: { type: Number, default: 0 },
    room: { type: String, default: "" },
  },
  { timestamps: true }
);

export type AllocationAttrs = InferSchemaType<typeof allocationSchema>;
export const Allocation = mongoose.model("Allocation", allocationSchema);
