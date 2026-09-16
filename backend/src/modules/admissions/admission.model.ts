import mongoose, { Schema, type InferSchemaType } from "mongoose";

const admissionSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    applicationNo: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    classApplied: { type: String, default: "" },
    parent: { type: String, default: "" },
    phone: { type: String, default: "" },
    source: { type: String, default: "" },
    appliedOn: { type: String, default: "" },
    stage: { type: String, default: "enquiry" },
    score: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ApplicationAttrs = InferSchemaType<typeof admissionSchema>;
export const Application = mongoose.model("Application", admissionSchema);
