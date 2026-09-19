import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A file attached to a student or teacher (birth certificate, marksheet,
 * qualification proof, etc.). The file itself is stored inline as a base64
 * data URL — the same approach used for avatars — so no external object store
 * is needed. Kept small by a client-side size cap.
 */
const documentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    ownerType: { type: String, enum: ["student", "teacher"], required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    /** base64 data URL of the file contents. */
    dataUrl: { type: String, required: true },
    size: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type DocumentAttrs = InferSchemaType<typeof documentSchema>;
export const StoredDocument = mongoose.model("Document", documentSchema);
export type StoredDocumentDoc = mongoose.HydratedDocument<DocumentAttrs>;

export function toPublicDocument(doc: StoredDocumentDoc) {
  const o = doc.toObject() as Record<string, unknown>;
  return {
    id: String(o._id),
    ownerType: o.ownerType,
    ownerId: o.ownerId,
    ownerName: o.ownerName,
    title: o.title,
    fileName: o.fileName,
    mimeType: o.mimeType,
    dataUrl: o.dataUrl,
    size: o.size,
    createdAt: o.createdAt,
  };
}
