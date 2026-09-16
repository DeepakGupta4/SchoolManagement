import mongoose, { Schema, type InferSchemaType } from "mongoose";

const feeStructureSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    tuition: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    lab: { type: Number, default: 0 },
    library: { type: Number, default: 0 },
    sports: { type: Number, default: 0 },
    misc: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type FeeStructureAttrs = InferSchemaType<typeof feeStructureSchema>;
export const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
