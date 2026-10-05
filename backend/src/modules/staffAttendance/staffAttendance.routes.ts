import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { StaffAttendance, STAFF_ATTENDANCE_STATUSES } from "./staffAttendance.model.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";

const router = Router();
router.use(requireAuth);

const dateField = z
  .string()
  .regex(ISO_DATE, "date must be YYYY-MM-DD")
  .refine(isRealDate, "That date doesn't exist on the calendar.");

const listQuery = z.object({ date: dateField });

/** Saved roll-call for one date (all teachers + staff marked that day). */
router.get("/", validate(listQuery, "query"), async (req, res, next) => {
  try {
    const { date } = parsed<z.infer<typeof listQuery>>(req, "query");
    const rows = await StaffAttendance.find({ schoolId: req.user!.schoolId, date });
    res.json({
      data: rows.map((r) => ({
        type: r.type,
        personId: r.personId,
        employeeId: r.employeeId,
        name: r.name,
        role: r.role,
        dept: r.dept,
        status: r.status,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const saveBody = z.object({
  date: dateField,
  records: z
    .array(
      z.object({
        type: z.enum(["teacher", "staff"]),
        personId: z.string().min(1),
        employeeId: z.string().default(""),
        name: z.string().default(""),
        role: z.string().default(""),
        dept: z.string().default(""),
        status: z.enum(STAFF_ATTENDANCE_STATUSES),
      })
    )
    .min(1, "Nothing to save"),
});

/** Upserts the whole roll-call for a date. Office/HR only. */
router.post(
  "/",
  requireRole("super_admin", "school_admin", "principal"),
  validate(saveBody),
  async (req, res, next) => {
    try {
      const { date, records } = req.body as z.infer<typeof saveBody>;
      const schoolId = req.user!.schoolId;

      await StaffAttendance.bulkWrite(
        records.map((r) => ({
          updateOne: {
            filter: { schoolId, type: r.type, personId: r.personId, date },
            update: { $set: { ...r, schoolId, date } },
            upsert: true,
          },
        }))
      );

      res.json({ data: { saved: records.length } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
