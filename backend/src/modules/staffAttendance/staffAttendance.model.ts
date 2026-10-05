import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One attendance record per employee (teacher or staff) per day. Teachers and
 * staff live in separate collections, so `type` + `personId` identifies the
 * person; the unique index makes a day's roll-call idempotent (re-saving upserts).
 */
export const STAFF_ATTENDANCE_STATUSES = ["present", "absent", "late", "half-day", "leave"] as const;
export type StaffAttendanceStatus = (typeof STAFF_ATTENDANCE_STATUSES)[number];

const staffAttendanceSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    type: { type: String, enum: ["teacher", "staff"], required: true },
    personId: { type: String, required: true }, // the Teacher/StaffMember _id
    employeeId: { type: String, default: "" },
    name: { type: String, default: "" },
    role: { type: String, default: "" },
    dept: { type: String, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: STAFF_ATTENDANCE_STATUSES, default: "present" },
  },
  { timestamps: true }
);

// One mark per person per day; re-saving upserts.
staffAttendanceSchema.index({ schoolId: 1, type: 1, personId: 1, date: 1 }, { unique: true });

export type StaffAttendanceAttrs = InferSchemaType<typeof staffAttendanceSchema>;
export const StaffAttendance = mongoose.model("StaffAttendance", staffAttendanceSchema);
