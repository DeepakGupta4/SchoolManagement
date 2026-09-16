import mongoose, { Schema, type InferSchemaType } from "mongoose";

const classSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    sections: { type: [String], default: [] },
    stream: { type: String, default: "General" },
    classTeacher: { type: String, default: "" },
    room: { type: String, default: "" },
    students: { type: Number, default: 0 },
    teachers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ClassAttrs = InferSchemaType<typeof classSchema>;
export const SchoolClass = mongoose.model("SchoolClass", classSchema);
