import mongoose, { Schema, type InferSchemaType } from "mongoose";

const studentDocumentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    studentId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    className: { type: String, default: "" },
    guardian: { type: String, default: "" },
    birthCert: { type: String, default: "missing" },
    aadhaar: { type: String, default: "missing" },
    tc: { type: String, default: "missing" },
    marksheets: { type: String, default: "missing" },
    photo: { type: String, default: "missing" },
  },
  { timestamps: true }
);

export type StudentDocumentAttrs = InferSchemaType<typeof studentDocumentSchema>;
export const StudentDocument = mongoose.model("StudentDocument", studentDocumentSchema);
