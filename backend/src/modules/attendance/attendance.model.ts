import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One attendance record per student per day. A class's roll-call for a date is
 * the set of records sharing (schoolId, className, section, date); the unique
 * index on (schoolId, studentId, date) keeps saving idempotent and stops a student
 * being marked twice on one day (even if two sections record them).
 */
export const ATTENDANCE_STATUSES = ["present", "absent", "late", "half-day", "leave"] as const;
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

// One mark per student per DAY — a student can't be marked twice on the same date,
// even across sections (the record still carries the className/section it was marked
// under). DEDUPE existing (studentId,date) duplicates per school BEFORE this builds,
// or the unique index creation fails silently (same caveat as teachers/classes).
attendanceSchema.index({ schoolId: 1, studentId: 1, date: 1 }, { unique: true });
// Non-unique: serves the per-class roll-call read (GET /?className&section&date) and
// the register aggregation, now that the unique key is (studentId, date).
attendanceSchema.index({ schoolId: 1, className: 1, section: 1, date: 1 });

export type AttendanceAttrs = InferSchemaType<typeof attendanceSchema>;
export const Attendance = mongoose.model("Attendance", attendanceSchema);
