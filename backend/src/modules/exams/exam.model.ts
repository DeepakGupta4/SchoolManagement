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

export type ExamAttrs = InferSchemaType<typeof examSchema>;
export const Exam = mongoose.model("Exam", examSchema);
