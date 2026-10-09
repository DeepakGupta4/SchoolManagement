import mongoose, { Schema, type InferSchemaType } from "mongoose";

const classSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    sections: { type: [String], default: [] },
    stream: { type: String, default: "General" },
    classTeacher: { type: String, default: "" },
    room: { type: String, default: "" },
    // NOTE: student/teacher counts are DERIVED live from the rosters (students by
    // className, teachers by classes[]), never stored here — a stored count drifts
    // the moment anyone is added/moved. The old `students`/`teachers` Number fields
    // were removed for that reason; don't reintroduce them.
  },
  { timestamps: true }
);

// A class name must be unique within a school (two "Class 6" rows would merge the
// name-keyed roster counts and make edit/delete ambiguous). The client blocks dupes
// too, but only the index is race-proof and API-proof. Case-insensitive collation so
// "Class 6" and "class 6" also collide — matching the client's lower-cased check.
// DEDUPE any existing duplicate class names per school BEFORE this builds, or the
// index creation fails silently. errorHandler LABELS.name turns a clash into a 409.
classSchema.index(
  { schoolId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export type ClassAttrs = InferSchemaType<typeof classSchema>;
export const SchoolClass = mongoose.model("SchoolClass", classSchema);
