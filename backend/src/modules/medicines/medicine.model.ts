import mongoose, { Schema, type InferSchemaType } from "mongoose";

const medicineSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    expiry: { type: String, default: "—" },
    status: { type: String, default: "In Stock" },
  },
  { timestamps: true }
);

export type MedicineAttrs = InferSchemaType<typeof medicineSchema>;
export const Medicine = mongoose.model("Medicine", medicineSchema);
