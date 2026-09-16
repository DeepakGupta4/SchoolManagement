import mongoose, { Schema, type InferSchemaType } from "mongoose";

const eventSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "" },
    date: { type: String, default: "" },
    venue: { type: String, default: "" },
    coordinator: { type: String, default: "" },
    participants: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    registration: { type: String, default: "open" },
    status: { type: String, default: "upcoming" },
    mediaCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type SchoolEventAttrs = InferSchemaType<typeof eventSchema>;
export const SchoolEvent = mongoose.model("SchoolEvent", eventSchema);
