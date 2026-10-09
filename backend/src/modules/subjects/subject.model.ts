import mongoose, { Schema, type InferSchemaType } from "mongoose";

const subjectSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, default: "" },
    department: { type: String, default: "" },
    type: { type: String, default: "Core" },
  },
  { timestamps: true }
);

// A subject name must be unique within a school — subjects are referenced by NAME
// everywhere (timetable, marks, teacher.subjects[], allocations, syllabus…), so a
// duplicate would make those references ambiguous. The client blocks dupes too, but
// only the index is race-proof and API-proof. Case-insensitive to match the client's
// lower-cased check. DEDUPE existing duplicate names per school BEFORE this builds,
// or the index creation fails silently. errorHandler LABELS.name → friendly 409.
subjectSchema.index(
  { schoolId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export type SubjectAttrs = InferSchemaType<typeof subjectSchema>;
export const Subject = mongoose.model("Subject", subjectSchema);
