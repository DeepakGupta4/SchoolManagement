import mongoose, { Schema, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    category: { type: String, default: "Direct" },
    time: { type: String, default: "" },
    unread: { type: Number, default: 0 },
    online: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type MessageAttrs = InferSchemaType<typeof messageSchema>;
export const Message = mongoose.model("Message", messageSchema);
