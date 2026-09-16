import mongoose, { Schema, type InferSchemaType } from "mongoose";

const transferSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    tcNo: { type: String, default: "—" },
    name: { type: String, required: true, trim: true },
    studentId: { type: String, default: "" },
    className: { type: String, default: "" },
    type: { type: String, default: "" },
    reason: { type: String, default: "" },
    requestedOn: { type: String, default: "" },
    issuedOn: { type: String, default: "—" },
    status: { type: String, default: "pending" },
    dues: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type TransferRequestAttrs = InferSchemaType<typeof transferSchema>;
export const TransferRequest = mongoose.model("TransferRequest", transferSchema);
