import mongoose, { Schema, type InferSchemaType } from "mongoose";

const admissionSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    applicationNo: { type: String, required: true, trim: true },
    // `name` stays the canonical display name (table, search, export, enrolment);
    // firstName/lastName capture the split like the student admission form.
    name: { type: String, required: true, trim: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    dateOfBirth: { type: String, default: "" },
    gender: { type: String, default: "" },
    classApplied: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    category: { type: String, default: "" },
    previousSchool: { type: String, default: "" },
    parent: { type: String, default: "" },
    relation: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    source: { type: String, default: "" },
    appliedOn: { type: String, default: "" },
    stage: { type: String, default: "enquiry" },
    score: { type: Number, default: 0 },
    notes: { type: String, default: "" },

    // Photo + medical, mirroring the student admission form.
    avatar: { type: String, default: "" },
    medicalNotes: { type: String, default: "" },

    // Parents (the primary contact is still stored flat as parent/relation/phone/email).
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
    motherTongue: { type: String, default: "" },
    aadhaarNo: { type: String, default: "" },
    placeOfBirth: { type: String, default: "" },
    annualIncome: { type: String, default: "" },
    correspondenceAddress: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },

    // Previous school.
    previousClass: { type: String, default: "" },
    previousBoard: { type: String, default: "" },
    tcNumber: { type: String, default: "" },
    previousResult: { type: String, default: "" },

    // Transport.
    transportRequired: { type: Boolean, default: false },
    pickupPoint: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ApplicationAttrs = InferSchemaType<typeof admissionSchema>;
export const Application = mongoose.model("Application", admissionSchema);
