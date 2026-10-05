import mongoose, { Schema, type InferSchemaType } from "mongoose";

const staffSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    employeeId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    dept: { type: String, default: "" },
    type: { type: String, default: "" },
    status: { type: String, default: "active" },
    gender: { type: String, default: "" },
    dateOfBirth: { type: String, default: "" },
    qualification: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    join: { type: String, default: "" },
    salary: { type: Number, default: 0 },
    // Passport-style photo (data URL), printed on the staff ID card.
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

// Employee IDs must be unique within a school (claimed in the UI; enforced here).
staffSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });

export type StaffMemberAttrs = InferSchemaType<typeof staffSchema>;
export const StaffMember = mongoose.model("StaffMember", staffSchema);
