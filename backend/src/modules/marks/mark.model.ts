import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One record per student per subject for a given exam + class-section. A class's
 * marksheet for an exam is the set of records sharing
 * (schoolId, examName, className, section); the unique index makes saving
 * idempotent — re-saving a subject's mark updates rather than duplicates.
 */
const markSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    examName: { type: String, required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, default: "" },
    roll: { type: Number, default: 0 },
    subject: { type: String, required: true },
    marks: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 100 },
  },
  { timestamps: true }
);

// One mark per student per subject per exam-class; re-saving upserts.
markSchema.index(
  { schoolId: 1, examName: 1, className: 1, section: 1, studentId: 1, subject: 1 },
  { unique: true }
);

export type MarkAttrs = InferSchemaType<typeof markSchema>;
export const Mark = mongoose.model("Mark", markSchema);
