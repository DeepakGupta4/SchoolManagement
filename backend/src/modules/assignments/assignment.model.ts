import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Empty is allowed (legacy rows / partial updates that don't touch the dates);
 * otherwise a date must be a real `yyyy-mm-dd` with a 4-digit year — this is
 * what rejects 6-digit-year garbage at the persistence layer too.
 */
function validDate(v: string): boolean {
  if (!v) return true;
  return ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
}

const assignmentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: "" },
    class: { type: String, default: "" },
    teacher: { type: String, default: "" },
    given: {
      type: String,
      default: "",
      validate: { validator: validDate, message: "Given date must be a valid date (YYYY-MM-DD)." },
    },
    due: {
      type: String,
      default: "",
      validate: { validator: validDate, message: "Due date must be a valid date (YYYY-MM-DD)." },
    },
    totalMarks: { type: Number, default: 0 },
    submitted: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, default: "upcoming" },
    type: { type: String, default: "" },
  },
  { timestamps: true }
);

/** Rejects due < given. Format is already caught by the path validators above. */
function assertDateOrder(given: string, due: string): void {
  if (given && due && validDate(given) && validDate(due) && due < given) {
    throw ApiError.badRequest("Due date must be on or after the given date.");
  }
}

// Create path (Model.create → doc.save()). A thrown ApiError rejects the save
// and is surfaced by the shared error handler as a 400.
assignmentSchema.pre("save", async function () {
  assertDateOrder((this.get("given") as string) || "", (this.get("due") as string) || "");
});

// Update path (the CRUD router's PUT uses findOneAndUpdate). A partial update may
// touch only one of the two dates, so the missing side is read from the stored doc.
assignmentSchema.pre("findOneAndUpdate", async function () {
  const update = (this.getUpdate() ?? {}) as Record<string, unknown>;
  const set = (update.$set as Record<string, unknown> | undefined) ?? update;
  const pick = (key: string): string | undefined =>
    typeof set[key] === "string" ? (set[key] as string) : undefined;

  let given = pick("given");
  let due = pick("due");
  if (given === undefined || due === undefined) {
    const existing = await this.model
      .findOne(this.getQuery())
      .lean<{ given?: string; due?: string } | null>();
    if (given === undefined) given = existing?.given;
    if (due === undefined) due = existing?.due;
  }
  assertDateOrder(given ?? "", due ?? "");
});

export type AssignmentAttrs = InferSchemaType<typeof assignmentSchema>;
export const Assignment = mongoose.model("Assignment", assignmentSchema);
