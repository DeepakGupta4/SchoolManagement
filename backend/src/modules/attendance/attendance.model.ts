import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One record per student per class per day. A class's roll-call for a date is
 * the set of records sharing (schoolId, className, section, date); the unique
 * index makes saving idempotent — re-saving updates rather than duplicates.
 */
export const ATTENDANCE_STATUSES = ["present", "absent", "late"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const attendanceSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    studentId: { type: String, required: true },
    studentName: { type: String, default: "" },
    roll: { type: Number, default: 0 },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: "present" },
  },
  { timestamps: true }
);

// One mark per student per class-day; re-saving upserts.
attendanceSchema.index(
  { schoolId: 1, className: 1, section: 1, date: 1, studentId: 1 },
  { unique: true }
);

export type AttendanceAttrs = InferSchemaType<typeof attendanceSchema>;
export const Attendance = mongoose.model("Attendance", attendanceSchema);
