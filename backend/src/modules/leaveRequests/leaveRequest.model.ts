import mongoose, { Schema, type InferSchemaType } from "mongoose";

const leaveRequestSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    type: { type: String, default: "" },
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    days: { type: Number, default: 1 },
    reason: { type: String, default: "" },
    status: { type: String, default: "Pending" },
    dept: { type: String, default: "" },
  },
  { timestamps: true }
);

export type LeaveRequestAttrs = InferSchemaType<typeof leaveRequestSchema>;
export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
