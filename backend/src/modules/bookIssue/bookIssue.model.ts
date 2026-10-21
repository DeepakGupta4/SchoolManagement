import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One circulation record: a single copy of a book issued to a borrower, through
 * to its return. `bookId` points at the catalogue Book whose `available` count
 * this record moves (-1 on issue, +1 on return); the title is denormalised as
 * `bookTitle` so the register still reads correctly if the catalogue entry is
 * later renamed or removed. The borrower is stored as display fields
 * (type + name + optional id), matching the app's no-foreign-key style.
 */
const BORROWER_TYPES = ["student", "staff", "teacher"] as const;
const ISSUE_STATUS = ["issued", "returned"] as const;

const bookIssueSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    /** Server-stamped reference, e.g. "ISS-0001". */
    code: { type: String, default: "" },
    /** The catalogue Book this copy came from (its _id as a string). */
    bookId: { type: String, required: true },
    /** Denormalised book title — survives a later catalogue rename/delete. */
    bookTitle: { type: String, required: true, trim: true },
    borrowerType: { type: String, enum: BORROWER_TYPES, default: "student" },
    borrowerName: { type: String, required: true, trim: true },
    borrowerId: { type: String, default: "" },
    /** Date issued (YYYY-MM-DD). */
    issueDate: { type: String, required: true },
    /** Date it is due back (YYYY-MM-DD). */
    dueDate: { type: String, required: true },
    /** Date actually returned (YYYY-MM-DD); "" until returned. */
    returnDate: { type: String, default: "" },
    status: { type: String, enum: ISSUE_STATUS, default: "issued", index: true },
    /** Overdue fine in rupees, computed at return time (₹2/day late). */
    fine: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// The register is listed newest-first and almost always narrowed by status
// (the issued/returned/overdue views), so index the tenant-scoped status query.
bookIssueSchema.index({ schoolId: 1, status: 1 });

export type BookIssueAttrs = InferSchemaType<typeof bookIssueSchema>;
export const BookIssue = mongoose.model("BookIssue", bookIssueSchema);
