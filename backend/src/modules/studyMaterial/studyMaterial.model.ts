import mongoose, { Schema, type InferSchemaType } from "mongoose";

const studyMaterialSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, default: "" },
    subject: { type: String, default: "" },
    klass: { type: String, default: "" },
    uploader: { type: String, default: "" },
    uploaded: { type: String, default: "" },
    sizeMb: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    visibility: { type: String, default: "draft" },
    description: { type: String, default: "" },
    tags: { type: [String], default: [] },
    url: { type: String, default: "" },
    // A resource is EITHER an uploaded file (stored inline as a base64 data URL)
    // OR an external link (`url`). These stay optional/back-compatible.
    fileDataUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    // Human-readable size captured from the uploaded file, e.g. "12.4 MB".
    sizeLabel: { type: String, default: "" },
  },
  { timestamps: true }
);

export type MaterialAttrs = InferSchemaType<typeof studyMaterialSchema>;
export const Material = mongoose.model("Material", studyMaterialSchema);
