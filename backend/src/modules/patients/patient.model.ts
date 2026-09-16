import mongoose, { Schema, type InferSchemaType } from "mongoose";

const patientSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    class: { type: String, default: "—" },
    issue: { type: String, default: "" },
    status: { type: String, default: "Under Treatment" },
    date: { type: String, default: "" },
    doctor: { type: String, default: "" },
    type: { type: String, default: "Student" },
  },
  { timestamps: true }
);

export type PatientAttrs = InferSchemaType<typeof patientSchema>;
export const Patient = mongoose.model("Patient", patientSchema);
