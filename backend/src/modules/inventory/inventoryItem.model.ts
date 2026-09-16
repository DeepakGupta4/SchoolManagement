import mongoose, { Schema, type InferSchemaType } from "mongoose";

const inventoryItemSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "" },
    qty: { type: Number, default: 0 },
    minQty: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    unitPrice: { type: Number, default: 0 },
    supplier: { type: String, default: "" },
    lastUpdated: { type: String, default: "" },
    status: { type: String, default: "in-stock" },
  },
  { timestamps: true }
);

export type InventoryItemAttrs = InferSchemaType<typeof inventoryItemSchema>;
export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
