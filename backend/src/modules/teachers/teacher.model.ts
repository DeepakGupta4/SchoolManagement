import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Teaching staff. Field names mirror the frontend's `Teacher` type so the two
 * sides stay in step.
 */
const teacherSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },

    employeeId: { type: String, required: true, trim: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    dateOfBirth: { type: String, required: true },
    joiningDate: { type: String, required: true },

    department: { type: String, required: true, index: true },
    subjects: { type: [String], default: [] },
    classes: { type: [String], default: [] },
    qualification: { type: String, required: true },
    experienceYears: { type: Number, default: 0, min: 0 },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "visiting"],
      default: "full-time",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "on-leave", "inactive", "resigned"],
      default: "active",
      index: true,
    },

    address: { type: String, required: true },
    avatar: { type: String, default: "" },
    salary: { type: Number, default: 0, min: 0 },
    isClassTeacher: { type: Boolean, default: false },

    // Server-owned metrics — clients never set these directly.
    rating: { type: Number, default: 0, min: 0, max: 5 },
    attendancePercent: { type: Number, default: 100, min: 0, max: 100 },
    weeklyPeriods: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Employee IDs are unique within a school, not globally — two schools on the
// same platform can both legitimately have "EMP1001".
teacherSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });

export type TeacherAttrs = InferSchemaType<typeof teacherSchema>;

export const Teacher = mongoose.model("Teacher", teacherSchema);

export type TeacherDoc = mongoose.HydratedDocument<TeacherAttrs>;
