import mongoose, { Schema, type InferSchemaType } from "mongoose";

const noticeSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    category: { type: String, default: "" },
    audience: { type: [String], default: [] },
    date: { type: String, default: "" },
    expiry: { type: String, default: "" },
    pinned: { type: Boolean, default: false },
    priority: { type: String, default: "Medium" },
    postedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export type NoticeAttrs = InferSchemaType<typeof noticeSchema>;
export const Notice = mongoose.model("Notice", noticeSchema);
