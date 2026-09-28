import mongoose, { Schema, type InferSchemaType } from "mongoose";

const syllabusSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    className: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    teacher: { type: String, default: "" },
    // Academic year the chapter is tracked under, e.g. "2026-27". Optional for
    // backward compatibility with rows created before this field existed.
    academicYear: { type: String, default: "", trim: true },
    unit: { type: String, required: true, trim: true },
    chapter: { type: String, required: true, trim: true },
    topics: { type: Number, default: 0 },
    completedTopics: { type: Number, default: 0 },
    status: { type: String, default: "pending" },
    date: { type: String, default: "—" },
  },
  { timestamps: true }
);

export type SyllabusAttrs = InferSchemaType<typeof syllabusSchema>;
export const Syllabus = mongoose.model("Syllabus", syllabusSchema);
