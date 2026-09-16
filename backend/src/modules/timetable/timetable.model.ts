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

export type TimetableAttrs = InferSchemaType<typeof timetableSchema>;
export const Timetable = mongoose.model("Timetable", timetableSchema);
