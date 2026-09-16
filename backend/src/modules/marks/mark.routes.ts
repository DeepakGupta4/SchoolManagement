import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { Mark } from "./mark.model.js";

const router = Router();
router.use(requireAuth);

const listQuery = z.object({
  examName: z.string().min(1),
  className: z.string().min(1),
  section: z.string().min(1),
});

/** Saved marks for one exam + class + section (empty if never saved). */
router.get("/", validate(listQuery, "query"), async (req, res, next) => {
  try {
    const { examName, className, section } = parsed<z.infer<typeof listQuery>>(req, "query");
    const rows = await Mark.find({
      schoolId: req.user!.schoolId,
      examName,
      className,
      section,
    });
    res.json({
      data: rows.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        roll: r.roll,
        subject: r.subject,
        marks: r.marks,
        maxMarks: r.maxMarks,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const saveBody = z.object({
  examName: z.string().min(1),
  className: z.string().min(1),
  section: z.string().min(1),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        studentName: z.string().default(""),
        roll: z.coerce.number<number>().default(0),
        subject: z.string().min(1),
        marks: z.coerce.number<number>().default(0),
        maxMarks: z.coerce.number<number>().default(100),
      })
    )
    .min(1, "Nothing to save"),
});

/** Upserts a set of subject marks for an exam-class. Teachers and up may enter. */
router.post(
  "/",
  requireRole("super_admin", "school_admin", "principal", "teacher"),
  validate(saveBody),
  async (req, res, next) => {
    try {
      const { examName, className, section, records } = req.body as z.infer<typeof saveBody>;
      const schoolId = req.user!.schoolId;

      await Mark.bulkWrite(
        records.map((r) => ({
          updateOne: {
            filter: {
              schoolId,
              examName,
              className,
              section,
              studentId: r.studentId,
              subject: r.subject,
            },
            update: { $set: { ...r, schoolId, examName, className, section } },
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
