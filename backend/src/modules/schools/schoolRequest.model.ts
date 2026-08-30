import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A public sign-up: a school asking for a 7-day demo. This is deliberately NOT
 * a tenant — no `schoolId`, no login is created here. It sits in a queue until
 * a Super Admin approves it, at which point a real `School` + admin `User` are
 * created and `schoolId` below is filled in to link back to them.
 */

export const REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

const schoolRequestSchema = new Schema(
  {
    schoolName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    studentCount: { type: Number, default: 0 },
    teacherCount: { type: Number, default: 0 },
    schoolType: { type: String, default: "" },
    website: { type: String, default: "" },
    message: { type: String, default: "" },

    status: { type: String, enum: REQUEST_STATUSES, default: "pending", index: true },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },

    // Filled once approved, so the admin list can join the created school's
    // live subscription state onto the request row.
    schoolId: { type: String, default: "" },
  },
  { timestamps: true }
);

export type SchoolRequestDoc = InferSchemaType<typeof schoolRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SchoolRequest = mongoose.model<SchoolRequestDoc>(
  "SchoolRequest",
  schoolRequestSchema
);

export function toPublicRequest(doc: SchoolRequestDoc) {
  return {
    id: String(doc._id),
    schoolName: doc.schoolName,
    ownerName: doc.ownerName,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    city: doc.city,
    state: doc.state,
    country: doc.country,
    studentCount: doc.studentCount,
    teacherCount: doc.teacherCount,
    schoolType: doc.schoolType,
    website: doc.website,
    message: doc.message,
    status: doc.status,
    reviewedBy: doc.reviewedBy,
    reviewedAt: doc.reviewedAt,
    rejectionReason: doc.rejectionReason,
    schoolId: doc.schoolId,
    createdAt: doc.createdAt,
  };
}
