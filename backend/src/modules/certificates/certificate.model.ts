import mongoose, { Schema, type InferSchemaType } from "mongoose";

const certificateSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, default: "" },
    student: { type: String, required: true, trim: true },
    admissionNo: { type: String, default: "" },
    className: { type: String, default: "" },
    type: { type: String, default: "" },
    requestedBy: { type: String, default: "" },
    requestedOn: { type: String, default: "" },
    issueDate: { type: String, default: null },
    verificationCode: { type: String, default: null },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export type CertificateAttrs = InferSchemaType<typeof certificateSchema>;
export const Certificate = mongoose.model("Certificate", certificateSchema);
