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
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    dept: { type: String, default: "" },
    // Applicant's login email — set when a teacher files their own leave, so
    // "My Leave" can scope to the caller. Empty for admin-entered requests.
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
  },
  { timestamps: true }
);

// Request codes must be unique within a school (claimed in the UI; enforced here).
leaveRequestSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export type LeaveRequestAttrs = InferSchemaType<typeof leaveRequestSchema>;
export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
