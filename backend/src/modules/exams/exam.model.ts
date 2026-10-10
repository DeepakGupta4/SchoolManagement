import mongoose, { Schema, type InferSchemaType } from "mongoose";

const examSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, default: "" },
    classes: { type: [String], default: [] },
    subject: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    duration: { type: String, default: "" },
    totalMarks: { type: Number, default: 0 },
    status: { type: String, default: "upcoming" },
    students: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// The exam NAME is the join key for Mark.examName and ScheduledExam.exam, so it must
// be unique within a school (a duplicate makes those references ambiguous). The code
// is a generated reference that must also be unique. DEDUPE existing duplicate
// names/codes per school BEFORE these build, or the index creation fails silently.
// errorHandler LABELS already map name/code to a friendly 409.
examSchema.index({ schoolId: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
examSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export type ExamAttrs = InferSchemaType<typeof examSchema>;
export const Exam = mongoose.model("Exam", examSchema);
