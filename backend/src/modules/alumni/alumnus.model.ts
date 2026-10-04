import mongoose, { Schema, type InferSchemaType } from "mongoose";

const alumnusSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    // Links an imported alumnus back to the source student (their admission no),
    // so re-importing graduates is idempotent and the two records stay connected.
    studentId: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    batch: { type: String, default: "" },
    stream: { type: String, default: "" },
    occupation: { type: String, default: "" },
    employer: { type: String, default: "" },
    city: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "" },
    mentor: { type: Boolean, default: false },
    interests: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Email is unique within a school (the directory's dedupe key and the form's
// "email must be unique" promise), but only for non-empty values — many records
// may legitimately have no email on file.
alumnusSchema.index(
  { schoolId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $gt: "" } } }
);

export type AlumnusAttrs = InferSchemaType<typeof alumnusSchema>;
export const Alumnus = mongoose.model("Alumnus", alumnusSchema);
