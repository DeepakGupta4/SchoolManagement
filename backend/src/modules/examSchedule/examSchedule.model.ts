import mongoose, { Schema, type InferSchemaType } from "mongoose";

const examScheduleSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    exam: { type: String, default: "" },
    subject: { type: String, default: "" },
    class: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    duration: { type: String, default: "" },
    room: { type: String, default: "" },
    invigilator: { type: String, default: "" },
    totalMarks: { type: Number, default: 0 },
    status: { type: String, default: "upcoming" },
  },
  { timestamps: true }
);

// The schedule code is a generated reference that must be unique within a school.
// DEDUPE existing duplicate codes before this builds, or the index fails silently.
examScheduleSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export type ScheduledExamAttrs = InferSchemaType<typeof examScheduleSchema>;
export const ScheduledExam = mongoose.model("ScheduledExam", examScheduleSchema);
