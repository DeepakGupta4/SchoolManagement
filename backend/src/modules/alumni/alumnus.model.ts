import mongoose, { Schema, type InferSchemaType } from "mongoose";

const alumnusSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    batch: { type: String, default: "" },
    stream: { type: String, default: "" },
    occupation: { type: String, default: "" },
    employer: { type: String, default: "" },
    city: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    mentor: { type: Boolean, default: false },
    interests: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type AlumnusAttrs = InferSchemaType<typeof alumnusSchema>;
export const Alumnus = mongoose.model("Alumnus", alumnusSchema);
