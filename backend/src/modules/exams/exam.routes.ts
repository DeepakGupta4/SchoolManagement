import { z } from "zod";
import { Exam } from "./exam.model.js";
import { Mark } from "../marks/mark.model.js";
import { ScheduledExam } from "../examSchedule/examSchedule.model.js";
import { createCrudRouter, toPublic } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";

// Empty (not scheduled yet) OR a real calendar date — never garbage like "2026-13-45"
// (which would also silently defeat the mark-entry "before the exam date" guard).
const examDate = z
  .string()
  .default("")
  .refine((d) => d === "" || (ISO_DATE.test(d) && isRealDate(d)), "Enter a valid date (YYYY-MM-DD).");

const examCreateSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.string().trim().default(""),
  classes: z.array(z.string()).default([]),
  subject: z.string().trim().default(""),
  date: examDate,
  time: z.string().trim().default(""),
  duration: z.string().trim().default(""),
  totalMarks: z.coerce.number<number>().min(0).default(0),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming"),
  students: z.coerce.number<number>().min(0).default(0),
});
const examUpdateSchema = examCreateSchema.partial();

export default createCrudRouter({
  model: Exam,
  createSchema: examCreateSchema,
  searchFields: ["name", "code", "subject", "type"],
  filterFields: ["status"],
  extend: (router) => {
    // Rename cascade — Exam.name is the join key for Mark.examName and
    // ScheduledExam.exam, so renaming the Exam row alone would orphan all of a
    // school's marks + scheduled papers for that exam.
    router.put(
      "/:id",
      requireRole("super_admin", "school_admin", "principal"),
      validate(examUpdateSchema),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const existing = await Exam.findOne({ _id: req.params.id, schoolId });
          if (!existing) throw ApiError.notFound("Exam not found.");
          const oldName = existing.name;

          const updated = await Exam.findOneAndUpdate(
            { _id: req.params.id, schoolId },
            req.body,
            { new: true, runValidators: true }
          );
          if (!updated) throw ApiError.notFound("Exam not found.");

          if (oldName !== updated.name) {
            await Promise.all([
              Mark.updateMany({ schoolId, examName: oldName }, { $set: { examName: updated.name } }),
              ScheduledExam.updateMany({ schoolId, exam: oldName }, { $set: { exam: updated.name } }),
            ]);
          }
          res.json({ data: toPublic(updated) });
        } catch (err) {
          next(err);
        }
      }
    );

    // Delete guard — block removing an exam that still has saved marks or scheduled
    // papers (otherwise they'd be orphaned and keep feeding performancePercent).
    router.delete("/:id", requireRole("super_admin", "school_admin", "principal"), async (req, res, next) => {
      try {
        const schoolId = req.user!.schoolId;
        const existing = await Exam.findOne({ _id: req.params.id, schoolId });
        if (!existing) throw ApiError.notFound("Exam not found.");

        const [marks, scheduled] = await Promise.all([
          Mark.countDocuments({ schoolId, examName: existing.name }),
          ScheduledExam.countDocuments({ schoolId, exam: existing.name }),
        ]);
        if (marks > 0 || scheduled > 0) {
          throw ApiError.conflict(
            `"${existing.name}" has ${marks} saved mark(s) and ${scheduled} scheduled paper(s). Remove those first, or rename the exam instead.`
          );
        }

        await Exam.deleteOne({ _id: req.params.id, schoolId });
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    });
  },
});
