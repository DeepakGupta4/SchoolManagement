import mongoose, { Schema, type InferSchemaType } from "mongoose";

const timetableSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    className: { type: String, required: true, trim: true },
    day: { type: String, required: true, trim: true },
    period: { type: Number, required: true, default: 1 },
    time: { type: String, default: "" },
    subject: { type: String, required: true, trim: true },
    teacher: { type: String, default: "" },
    room: { type: String, default: "" },
  },
  { timestamps: true }
);

// One entry per class/day/period — a slot can't hold two periods (the UI edits a
// cell in place, but this is the race-/API-proof guarantee). DEDUPE existing dupes
// per school before this builds, or the index creation fails silently.
timetableSchema.index({ schoolId: 1, className: 1, day: 1, period: 1 }, { unique: true });

// Speeds up the teacher/room double-booking (clash) lookups, which query a single
// day+period across the school.
timetableSchema.index({ schoolId: 1, day: 1, period: 1 });

export type TimetableAttrs = InferSchemaType<typeof timetableSchema>;
export const Timetable = mongoose.model("Timetable", timetableSchema);
