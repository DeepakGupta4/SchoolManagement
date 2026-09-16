import mongoose, { Schema, type InferSchemaType } from "mongoose";

const labSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, default: "" },
    block: { type: String, default: "" },
    capacity: { type: Number, default: 0 },
    inCharge: { type: String, default: "" },
    assistant: { type: String, default: "" },
    equipmentTotal: { type: Number, default: 0 },
    equipmentWorking: { type: Number, default: 0 },
    weeklyPracticals: { type: Number, default: 0 },
    nextPractical: { type: String, default: "" },
    nextPracticalClass: { type: String, default: "" },
    status: { type: String, default: "operational" },
  },
  { timestamps: true }
);

export type LabAttrs = InferSchemaType<typeof labSchema>;
export const Lab = mongoose.model("Lab", labSchema);
