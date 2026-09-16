import mongoose, { Schema, type InferSchemaType } from "mongoose";

const visitorSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    purpose: { type: String, default: "" },
    whomToMeet: { type: String, default: "" },
    inTime: { type: String, default: "" },
    outTime: { type: String, default: null },
    passCode: { type: String, default: "" },
    status: { type: String, default: "inside" },
    pickupFor: { type: String, default: null },
  },
  { timestamps: true }
);

export type VisitorAttrs = InferSchemaType<typeof visitorSchema>;
export const Visitor = mongoose.model("Visitor", visitorSchema);
