import mongoose, { Schema, type InferSchemaType } from "mongoose";

const menuItemSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "" },
    price: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    sold: { type: Number, default: 0 },
    emoji: { type: String, default: "🍽️" },
  },
  { timestamps: true }
);

export type MenuItemAttrs = InferSchemaType<typeof menuItemSchema>;
export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
