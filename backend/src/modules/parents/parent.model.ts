import mongoose, { Schema, type InferSchemaType } from "mongoose";

const parentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    name: { type: String, required: true, trim: true },
    // One of "Father" | "Mother" | "Guardian"; kept a plain string so the model
    // stays lenient (the frontend zod schema constrains the UI choices).
    relation: { type: String, default: "Guardian" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    occupation: { type: String, default: "" },
    address: { type: String, default: "" },
    // Safety/role flags for this contact.
    isPrimary: { type: Boolean, default: false },
    isEmergencyContact: { type: Boolean, default: false },
    isPickupAuthorized: { type: Boolean, default: false },
    // Mapping to the students module. Stores each linked student's `_id` (the
    // stable `id` the students API returns), NOT the admission number — the
    // `_id` is immutable and gives an exact join when resolving a parent's
    // children live, whereas an admission number can be edited. Empty by default
    // so a parent can be created first and children linked later.
    students: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type ParentAttrs = InferSchemaType<typeof parentSchema>;
export const Parent = mongoose.model("Parent", parentSchema);
