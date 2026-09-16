import mongoose, { Schema, type InferSchemaType } from "mongoose";

const onlineClassSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    topic: { type: String, required: true, trim: true },
    subject: { type: String, default: "" },
    teacher: { type: String, default: "" },
    klass: { type: String, default: "" },
    platform: { type: String, default: "" },
    state: { type: String, default: "scheduled" },
    when: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    attendees: { type: Number, default: 0 },
    link: { type: String, default: "" },
    agenda: { type: String, default: "" },
  },
  { timestamps: true }
);

export type OnlineClassAttrs = InferSchemaType<typeof onlineClassSchema>;
export const OnlineClass = mongoose.model("OnlineClass", onlineClassSchema);
