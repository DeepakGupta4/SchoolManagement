import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { Mark } from "./mark.model.js";
import { Exam } from "../exams/exam.model.js";

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

      // Marks can't be entered before the exam has taken place. Enforce server-
      // side (matching the UI lock) so the future-date guard can't be bypassed
      // by calling the API directly. A date of today or in the past is allowed.
      const exam = await Exam.findOne({ schoolId, name: examName });
      const today = new Date().toISOString().slice(0, 10);
      if (
        exam &&
        typeof exam.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(exam.date) &&
        exam.date > today
      ) {
        throw ApiError.badRequest(
          `Marks for "${examName}" can't be entered before the exam date (${exam.date}).`
        );
      }

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
