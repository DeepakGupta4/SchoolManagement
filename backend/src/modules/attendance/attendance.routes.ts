import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { Attendance, ATTENDANCE_STATUSES } from "./attendance.model.js";

const router = Router();
router.use(requireAuth);

const listQuery = z.object({
  className: z.string().min(1),
  section: z.string().min(1),
  date: z.string().min(1),
});

/** Saved roll-call for one class + section on one date. */
router.get("/", validate(listQuery, "query"), async (req, res, next) => {
  try {
    const { className, section, date } = parsed<z.infer<typeof listQuery>>(req, "query");
    const rows = await Attendance.find({
      schoolId: req.user!.schoolId,
      className,
      section,
      date,
    });
    res.json({
      data: rows.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        roll: r.roll,
        status: r.status,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const saveBody = z.object({
  className: z.string().min(1),
  section: z.string().min(1),
  date: z.string().min(1),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        studentName: z.string().default(""),
        roll: z.coerce.number<number>().default(0),
        status: z.enum(ATTENDANCE_STATUSES),
      })
    )
    .min(1, "Nothing to save"),
});

/** Upserts the whole roll-call for a class-day. Teachers and up may mark. */
router.post(
  "/",
  requireRole("super_admin", "school_admin", "principal", "teacher"),
  validate(saveBody),
  async (req, res, next) => {
    try {
      const { className, section, date, records } = req.body as z.infer<typeof saveBody>;
      const schoolId = req.user!.schoolId;

      await Attendance.bulkWrite(
        records.map((r) => ({
          updateOne: {
            filter: { schoolId, className, section, date, studentId: r.studentId },
            update: { $set: { ...r, schoolId, className, section, date } },
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
