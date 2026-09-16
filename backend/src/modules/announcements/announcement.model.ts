import mongoose, { Schema, type InferSchemaType } from "mongoose";

const announcementSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    author: { type: String, default: "" },
    audience: { type: [String], default: [] },
    category: { type: String, default: "" },
    date: { type: String, default: "" },
    pinned: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type AnnouncementAttrs = InferSchemaType<typeof announcementSchema>;
export const Announcement = mongoose.model("Announcement", announcementSchema);
