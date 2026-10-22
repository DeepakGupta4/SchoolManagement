import { z } from "zod";
import mongoose from "mongoose";
import { BookIssue } from "./bookIssue.model.js";
import { Book } from "../books/book.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";
import type { UserRole } from "../auth/user.model.js";

/** Rupees charged per day a book is returned late. */
const FINE_PER_DAY = 2;

// The librarian runs circulation — same write roles as the catalogue
// (book.routes.ts). Shared so the custom /return route guards identically.
const WRITE_ROLES: UserRole[] = ["super_admin", "school_admin", "principal", "librarian"];

const bookIssueSchema = z.object({
  bookId: z.string().min(1),
  bookTitle: z.string().min(1),
  borrowerType: z.enum(["student", "staff", "teacher"]).default("student"),
  borrowerName: z.string().min(1),
  borrowerId: z.string().default(""),
  issueDate: z
    .string()
    .min(1)
    .regex(ISO_DATE, "Issue date must be YYYY-MM-DD")
    .refine(isRealDate, "Enter a valid issue date"),
  dueDate: z
    .string()
    .min(1)
    .regex(ISO_DATE, "Due date must be YYYY-MM-DD")
    .refine(isRealDate, "Enter a valid due date"),
});

export default createCrudRouter({
  model: BookIssue,
  createSchema: bookIssueSchema,
  searchFields: ["bookTitle", "borrowerName", "code"],
  filterFields: ["status", "borrowerType"],
  writeRoles: WRITE_ROLES,
  readRoles: ["super_admin", "school_admin", "principal", "librarian"],
  // Reference code is server-owned; a new record always starts out issued and
  // unreturned. The client never sends these (stripped by the schema above).
  generate: (seq) => ({
    code: `ISS-${String(seq + 1).padStart(4, "0")}`,
    status: "issued",
    returnDate: "",
  }),
  // Issuing a copy takes it off the shelf: decrement the Book's available count.
  // Best-effort and fully guarded (valid id, same school, stock remaining) so a
  // stale bookId can neither drive availability negative nor fail the issue.
  afterCreate: async (doc, req) => {
    if (!mongoose.isValidObjectId(doc.bookId)) return;
    await Book.updateOne(
      { _id: doc.bookId, schoolId: req.user!.schoolId, available: { $gt: 0 } },
      { $inc: { available: -1 } }
    ).catch(() => {});
  },
  extend: (router) => {
    // Return a book: stamp the return date, charge any overdue fine, and put the
    // copy back on the shelf. Idempotent — returning an already-returned record
    // just echoes it back without moving availability (or the fine) a second time.
    router.post("/:id/return", requireRole(...WRITE_ROLES), async (req, res, next) => {
      try {
        const schoolId = req.user!.schoolId;
        const issue = await BookIssue.findOne({ _id: req.params.id, schoolId });
        if (!issue) throw ApiError.notFound("Issue record not found.");

        if (issue.status === "returned") {
          res.json({
            data: {
              id: String(issue._id),
              status: issue.status,
              returnDate: issue.returnDate,
              fine: issue.fine,
            },
          });
          return;
        }

        const today = new Date().toISOString().slice(0, 10);
        let fine = 0;
        // Only a genuinely late return carries a fine, and only when the due date
        // is a real YYYY-MM-DD we can measure the overdue span against.
        if (ISO_DATE.test(issue.dueDate) && today > issue.dueDate) {
          const overdueDays = Math.round(
            (Date.parse(today) - Date.parse(issue.dueDate)) / 86_400_000
          );
          fine = Math.max(0, overdueDays) * FINE_PER_DAY;
        }

        issue.returnDate = today;
        issue.fine = fine;
        issue.status = "returned";
        await issue.save();

        // Shelf the copy again — best-effort, mirroring the issue-time decrement.
        if (mongoose.isValidObjectId(issue.bookId)) {
          await Book.updateOne({ _id: issue.bookId, schoolId }, { $inc: { available: 1 } }).catch(
            () => {}
          );
        }

        res.json({
          data: {
            id: String(issue._id),
            status: issue.status,
            returnDate: issue.returnDate,
            fine: issue.fine,
          },
        });
      } catch (err) {
        next(err);
      }
    });
  },
});
