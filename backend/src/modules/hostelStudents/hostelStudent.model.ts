import mongoose, { Schema, type InferSchemaType } from "mongoose";

const hostelStudentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    studentId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    class: { type: String, default: "" },
    hostel: { type: String, default: "" },
    room: { type: String, default: "" },
    type: { type: String, default: "" },
    fees: { type: String, default: "Pending" },
    joinDate: { type: String, default: "" },
    contact: { type: String, default: "" },
  },
  { timestamps: true }
);

export type HostelStudentAttrs = InferSchemaType<typeof hostelStudentSchema>;
export const HostelStudent = mongoose.model("HostelStudent", hostelStudentSchema);
