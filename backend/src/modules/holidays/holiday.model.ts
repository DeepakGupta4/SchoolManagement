import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A calendar day the school is closed. Attendance treats a matching date as a
 * holiday — no one is marked absent and the auto-absent sweep skips the day.
 */
const holidaySchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    name: { type: String, required: true },
    type: { type: String, default: "Holiday" },
  },
  { timestamps: true }
);

export type HolidayAttrs = InferSchemaType<typeof holidaySchema>;
export const Holiday = mongoose.model("Holiday", holidaySchema);
