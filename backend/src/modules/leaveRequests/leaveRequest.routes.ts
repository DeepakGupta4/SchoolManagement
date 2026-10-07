import { z } from "zod";
import type { HydratedDocument } from "mongoose";
import { LeaveRequest, type LeaveRequestAttrs } from "./leaveRequest.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { validate } from "../../middleware/validate.js";
import { shortId } from "../../utils/password.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";

// A real YYYY-MM-DD date. (from <= to is enforced client-side for the admin form —
// an object-level zod refine can't be used in the create schema because crudRouter
// calls createSchema.partial().)
const leaveDate = z
  .string()
  .min(1, "Date is required.")
  .regex(ISO_DATE, "Use a YYYY-MM-DD date.")
  .refine(isRealDate, "That date doesn't exist on the calendar.");

const leaveRequestSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(""),
  type: z.string().default(""),
  from: leaveDate,
  to: leaveDate,
  days: z.coerce.number<number>().min(1).default(1),
  reason: z.string().default(""),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  dept: z.string().default(""),
  email: z.string().default(""),
});

/** Inclusive whole-day count between two YYYY-MM-DD dates (>= 1). */
function dayCount(from: string, to: string): number {
  const a = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const b = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

// Self-service: a teacher/staff member files their OWN leave. Cross-field checks
// are fine here (standalone schema, not run through createSchema.partial()).
const applyBody = z
  .object({
    type: z.string().min(1, "Leave type is required."),
    from: leaveDate,
    to: leaveDate,
    reason: z.string().min(1, "Reason is required."),
  })
  .refine((o) => o.to >= o.from, { message: "End date must be on or after the start date.", path: ["to"] });

export default createCrudRouter({
  model: LeaveRequest,
  createSchema: leaveRequestSchema,
  searchFields: ["name", "code", "dept", "role"],
  filterFields: ["status", "type"],
  // Leave reasons are health-adjacent PII — restrict the FULL list to office/HR.
  // Self-service /mine routes below are scoped to the caller, so they're open to
  // any signed-in user (a teacher only ever sees/creates their own).
  readRoles: ["super_admin", "school_admin", "principal"],
  extend: (router) => {
    const toPublic = (r: HydratedDocument<LeaveRequestAttrs>) => ({
      id: String(r._id),
      code: r.code,
      name: r.name,
      role: r.role,
      type: r.type,
      from: r.from,
      to: r.to,
      days: r.days,
      reason: r.reason,
      status: r.status,
      dept: r.dept,
      email: r.email,
    });

    // The caller's own leave requests (matched on their login email).
    router.get("/mine", async (req, res, next) => {
      try {
        const email = (req.user!.email || "").toLowerCase();
        const rows = await LeaveRequest.find({ schoolId: req.user!.schoolId, email }).sort({ createdAt: -1 });
        res.json({ data: rows.map(toPublic) });
      } catch (err) {
        next(err);
      }
    });

    // File a leave for oneself. Name/role/department are stamped from the caller's
    // teacher record (not trusted from the client); status always starts Pending.
    router.post("/mine", validate(applyBody), async (req, res, next) => {
      try {
        const { type, from, to, reason } = req.body as z.infer<typeof applyBody>;
        const schoolId = req.user!.schoolId;
        const email = (req.user!.email || "").toLowerCase();
        const teacher = await Teacher.findOne({ schoolId, email });
        const name = teacher ? `${teacher.firstName} ${teacher.lastName}`.trim() : email || "Me";
        const doc = await LeaveRequest.create({
          schoolId,
          code: `LV-${shortId(6).toUpperCase()}`,
          name,
          role: teacher ? "Teacher" : "",
          type,
          from,
          to,
          days: dayCount(from, to),
          reason,
          status: "Pending",
          dept: teacher?.department ?? "",
          email,
        });
        res.status(201).json({ data: toPublic(doc) });
      } catch (err) {
        next(err);
      }
    });
  },
});
