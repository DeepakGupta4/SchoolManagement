import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Student record. Field names mirror the frontend's `Student` type so the two
 * sides stay in step; the API maps `_id` to `id` on the way out.
 */
const guardianSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    occupation: { type: String, default: "" },
  },
  { _id: false }
);

const studentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },

    admissionNo: { type: String, required: true, trim: true, index: true },
    rollNo: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", null], default: null },
    className: { type: String, required: true, index: true },
    section: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "alumni", "transferred"],
      default: "active",
      index: true,
    },
    admissionDate: { type: String, required: true },
    address: { type: String, required: true },
    guardian: { type: guardianSchema, required: true },

    /** Photo, stored inline as a data URL for now. */
    avatar: { type: String, default: "" },
    medicalNotes: { type: String, default: "" },

    // --- Optional admission-form details ---------------------------------
    // All optional (default "" / false) so existing records and the required
    // `guardian` above keep working unchanged. Captured at registration so the
    // printable admission form comes out fully filled.

    // Parents (separate from the required `guardian`).
    fatherName: { type: String, default: "" },
    fatherOccupation: { type: String, default: "" },
    fatherPhone: { type: String, default: "" },
    fatherEmail: { type: String, default: "" },
    motherName: { type: String, default: "" },
    motherOccupation: { type: String, default: "" },
    motherPhone: { type: String, default: "" },
    motherEmail: { type: String, default: "" },

    // Other particulars.
    nationality: { type: String, default: "" },
    religion: { type: String, default: "" },
    category: { type: String, default: "" },
    motherTongue: { type: String, default: "" },
    aadhaarNo: { type: String, default: "" },
    placeOfBirth: { type: String, default: "" },
    annualIncome: { type: String, default: "" },

    // Contact extras.
    correspondenceAddress: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },

    // Previous school.
    previousSchool: { type: String, default: "" },
    previousClass: { type: String, default: "" },
    previousBoard: { type: String, default: "" },
    tcNumber: { type: String, default: "" },
    previousResult: { type: String, default: "" },

    // Transport.
    transportRequired: { type: Boolean, default: false },
    pickupPoint: { type: String, default: "" },

    // Server-owned metrics — clients never set these directly.
    attendancePercent: { type: Number, default: 100, min: 0, max: 100 },
    performancePercent: { type: Number, default: 0, min: 0, max: 100 },
    feeDue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Admission numbers must be unique WITHIN a school, not globally — two schools
// on the same platform can legitimately both have "ADM2024001".
studentSchema.index({ schoolId: 1, admissionNo: 1 }, { unique: true });

export type StudentAttrs = InferSchemaType<typeof studentSchema>;

export const Student = mongoose.model("Student", studentSchema);

/** A loaded document, with Mongoose's instance methods attached. */
export type StudentDoc = mongoose.HydratedDocument<StudentAttrs>;

/**
 * Maps a document to the shape the frontend expects: `_id` becomes `id`, and
 * internal bookkeeping fields are dropped rather than leaked to the client.
 */
export function toPublicStudent(doc: StudentDoc) {
  const { _id, schoolId, createdAt, updatedAt, __v, ...rest } = doc.toObject() as Record<
    string,
    unknown
  >;
  void schoolId;
  void createdAt;
  void updatedAt;
  void __v;
  return { ...rest, id: String(_id) };
}
