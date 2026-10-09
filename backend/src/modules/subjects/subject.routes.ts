import { z } from "zod";
import type { Model } from "mongoose";
import { Subject } from "./subject.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Department } from "../departments/department.model.js";
import { Timetable } from "../timetable/timetable.model.js";
import { Mark } from "../marks/mark.model.js";
import { Exam } from "../exams/exam.model.js";
import { ScheduledExam } from "../examSchedule/examSchedule.model.js";
import { Allocation } from "../allocations/allocation.model.js";
import { Syllabus } from "../syllabus/syllabus.model.js";
import { Material } from "../studyMaterial/studyMaterial.model.js";
import { OnlineClass } from "../onlineClasses/onlineClass.model.js";
import { Substitution } from "../substitutions/substitution.model.js";
import { Assignment } from "../assignments/assignment.model.js";
import { createCrudRouter, toPublic } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const subjectCreateSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().default(""),
  department: z.string().trim().default(""),
  type: z.string().trim().default("Core"),
});
const subjectUpdateSchema = subjectCreateSchema.partial();

/**
 * Every collection that stores an academic subject by NAME — used to CASCADE a
 * rename and to GUARD a delete. NOTE: `message.subject` is an email-style subject
 * LINE, not an academic subject, so it is deliberately excluded.
 */
const SUBJECT_REFS: { model: Model<Record<string, unknown>>; field: string; array?: boolean }[] = [
  { model: Teacher as unknown as Model<Record<string, unknown>>, field: "subjects", array: true },
  { model: Department as unknown as Model<Record<string, unknown>>, field: "subjects", array: true },
  { model: Timetable as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: Mark as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: Exam as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: ScheduledExam as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: Allocation as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: Syllabus as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: Material as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: OnlineClass as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: Substitution as unknown as Model<Record<string, unknown>>, field: "subject" },
  { model: Assignment as unknown as Model<Record<string, unknown>>, field: "subject" },
];

/** Total references to a subject name across all the collections above (stops early). */
async function countSubjectRefs(schoolId: string, name: string): Promise<number> {
  let total = 0;
  for (const ref of SUBJECT_REFS) {
    total += await ref.model.countDocuments({ schoolId, [ref.field]: name });
    if (total > 0) break;
  }
  return total;
}

export default createCrudRouter({
  model: Subject,
  createSchema: subjectCreateSchema,
  searchFields: ["name", "code", "department"],
  filterFields: ["department", "type"],
  extend: (router) => {
    // Custom update — a subject is referenced by NAME across ~12 collections, so
    // renaming the Subject row alone would orphan all of them. The generic afterUpdate
    // hook only sees the already-renamed doc, so the cascade must run here where the
    // old name is still known. Extend routes are NOT auto role-gated.
    router.put(
      "/:id",
      requireRole("super_admin", "school_admin", "principal"),
      validate(subjectUpdateSchema),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const existing = await Subject.findOne({ _id: req.params.id, schoolId });
          if (!existing) throw ApiError.notFound("Subject not found.");
          const oldName = existing.name;

          const updated = await Subject.findOneAndUpdate(
            { _id: req.params.id, schoolId },
            req.body,
            { new: true, runValidators: true }
          );
          if (!updated) throw ApiError.notFound("Subject not found.");
          const newName = updated.name;

          if (oldName !== newName) {
            await Promise.all(
              SUBJECT_REFS.map((ref) =>
                ref.array
                  ? ref.model.updateMany(
                      { schoolId, [ref.field]: oldName },
                      { $set: { [`${ref.field}.$[e]`]: newName } },
                      { arrayFilters: [{ e: oldName }] }
                    )
                  : ref.model.updateMany(
                      { schoolId, [ref.field]: oldName },
                      { $set: { [ref.field]: newName } }
                    )
              )
            );
          }

          res.json({ data: toPublic(updated) });
        } catch (err) {
          next(err);
        }
      }
    );

    // Custom delete — block removing a subject that is still referenced anywhere
    // (otherwise those references dangle). The admin should rename it, or unwire it
    // from the timetable/teachers/etc. first.
    router.delete("/:id", requireRole("super_admin", "school_admin", "principal"), async (req, res, next) => {
      try {
        const schoolId = req.user!.schoolId;
        const existing = await Subject.findOne({ _id: req.params.id, schoolId });
        if (!existing) throw ApiError.notFound("Subject not found.");

        if ((await countSubjectRefs(schoolId, existing.name)) > 0) {
          throw ApiError.conflict(
            `"${existing.name}" is still in use (timetable, teacher assignments, marks, syllabus, etc.). Rename it instead, or remove it from those first.`
          );
        }

        await Subject.deleteOne({ _id: req.params.id, schoolId });
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    });
  },
});
