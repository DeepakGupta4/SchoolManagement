import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A cover arrangement: when a teacher is away, one of their timetable periods
 * is handed to a substitute for a given date. One document = one covered period.
 * Teacher/class are stored as the same display-name strings the Timetable uses
 * (the app has no teacher↔class foreign keys), and `substituteEmail` is the key
 * used to notify the substitute in-app.
 */
const SUBSTITUTION_STATUS = ["assigned", "cancelled"] as const;

const substitutionSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    /** Date of the absence (YYYY-MM-DD). */
    date: { type: String, required: true, index: true },
    /** Weekday name of `date`, denormalized for display (e.g. "Monday"). */
    day: { type: String, default: "" },
    period: { type: Number, required: true, default: 1 },
    time: { type: String, default: "" },
    className: { type: String, default: "" },
    subject: { type: String, default: "" },
    room: { type: String, default: "" },
    absentTeacher: { type: String, required: true, trim: true },
    absentEmpId: { type: String, default: "" },
    substituteTeacher: { type: String, required: true, trim: true },
    substituteEmpId: { type: String, default: "" },
    /** Substitute's login email — the target for the in-app notification. */
    substituteEmail: { type: String, default: "", lowercase: true, trim: true },
    status: { type: String, enum: SUBSTITUTION_STATUS, default: "assigned", index: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Cover arrangements are almost always queried a day at a time.
substitutionSchema.index({ schoolId: 1, date: 1 });

export type SubstitutionAttrs = InferSchemaType<typeof substitutionSchema>;
export const Substitution = mongoose.model("Substitution", substitutionSchema);
