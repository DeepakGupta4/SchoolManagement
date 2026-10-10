import { z } from "zod";
import { SchoolClass } from "./class.model.js";
import { Student } from "../students/student.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Timetable } from "../timetable/timetable.model.js";
import { Mark } from "../marks/mark.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Exam } from "../exams/exam.model.js";
import { ScheduledExam } from "../examSchedule/examSchedule.model.js";
import { createCrudRouter, toPublic } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const SECTION_SEQUENCE = ["A", "B", "C", "D", "E", "F", "G", "H"];

/**
 * Sections must be a gap-free run starting at A (A, A-B, A-B-C…) — the same rule
 * the client enforces, replicated here so a direct API call can't store a class
 * with a hole ("A, D"), a missing A, or junk letters. A class can't have D without
 * also having A, B and C.
 */
function isContiguousFromA(sections: string[]): boolean {
  const unique = [...new Set(sections)];
  if (unique.length === 0) return false;
  const sorted = [...unique].sort();
  return sorted.every((s, i) => s === SECTION_SEQUENCE[i]);
}

/** Escapes regex metacharacters so a class name is matched literally in a $regex. */
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const classCreateSchema = z.object({
  name: z.string().trim().min(1),
  sections: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one section")
    .refine((a) => new Set(a).size === a.length, "Duplicate sections are not allowed")
    .refine(isContiguousFromA, "Sections must run in order from A — no gaps (e.g. A, B, C)"),
  stream: z.string().trim().min(1).default("General"),
  classTeacher: z.string().trim().default(""),
  room: z.string().trim().default(""),
});

// Partial for updates (PATCH-style); the field-level section rules above still run
// whenever `sections` is present.
const classUpdateSchema = classCreateSchema.partial();

export default createCrudRouter({
  model: SchoolClass,
  createSchema: classCreateSchema,
  searchFields: ["name", "classTeacher", "room", "stream"],
  filterFields: ["stream"],
  extend: (router) => {
    // Custom update — a class is referenced everywhere by its NAME (student.className,
    // teacher.classes[]/classTeacherOf, attendance/marks/fees/promotion grouping), so
    // renaming the class row alone would orphan all of it. The generic afterUpdate hook
    // only sees the already-renamed doc, so the cascade must run here where we still
    // know the old name. Extend routes are NOT auto-role-gated, so gate explicitly.
    router.put(
      "/:id",
      requireRole("super_admin", "school_admin", "principal"),
      validate(classUpdateSchema),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const existing = await SchoolClass.findOne({ _id: req.params.id, schoolId });
          if (!existing) throw ApiError.notFound("Class not found.");
          const oldName = existing.name;

          const updated = await SchoolClass.findOneAndUpdate(
            { _id: req.params.id, schoolId },
            req.body,
            { new: true, runValidators: true }
          );
          if (!updated) throw ApiError.notFound("Class not found.");
          const newName = updated.name;

          if (oldName !== newName) {
            await Promise.all([
              Student.updateMany({ schoolId, className: oldName }, { $set: { className: newName } }),
              Teacher.updateMany(
                { schoolId, classes: oldName },
                { $set: { "classes.$[c]": newName } },
                { arrayFilters: [{ c: oldName }] }
              ),
              Teacher.updateMany(
                { schoolId, classTeacherOf: oldName },
                { $set: { classTeacherOf: newName } }
              ),
              // Timetable keys by the COMPOSITE "<class> - <section>", so swap just
              // the class-name prefix, preserving each row's section.
              Timetable.updateMany({ schoolId, className: { $regex: `^${escapeRegex(oldName)} - ` } }, [
                {
                  $set: {
                    className: {
                      $concat: [
                        newName,
                        { $substrCP: ["$className", oldName.length, { $strLenCP: "$className" }] },
                      ],
                    },
                  },
                },
              ]),
              // Exam-feature + attendance references are BARE class names (no section).
              Mark.updateMany({ schoolId, className: oldName }, { $set: { className: newName } }),
              Attendance.updateMany({ schoolId, className: oldName }, { $set: { className: newName } }),
              ScheduledExam.updateMany({ schoolId, class: oldName }, { $set: { class: newName } }),
              Exam.updateMany(
                { schoolId, classes: oldName },
                { $set: { "classes.$[e]": newName } },
                { arrayFilters: [{ e: oldName }] }
              ),
            ]);
          }

          res.json({ data: toPublic(updated) });
        } catch (err) {
          next(err);
        }
      }
    );

    // Custom delete — block while students are still enrolled (otherwise they'd be
    // orphaned: className pointing at a class that no longer exists, and promotion
    // rejects an unknown class name), then scrub the class off any teacher record.
    router.delete("/:id", requireRole("super_admin", "school_admin", "principal"), async (req, res, next) => {
      try {
        const schoolId = req.user!.schoolId;
        const existing = await SchoolClass.findOne({ _id: req.params.id, schoolId });
        if (!existing) throw ApiError.notFound("Class not found.");
        const name = existing.name;

        const enrolled = await Student.countDocuments({ schoolId, className: name, status: "active" });
        if (enrolled > 0) {
          throw ApiError.conflict(
            `"${name}" still has ${enrolled} active student(s). Move or transfer them to another class before deleting it.`
          );
        }

        await SchoolClass.deleteOne({ _id: req.params.id, schoolId });

        await Promise.all([
          Teacher.updateMany({ schoolId, classes: name }, { $pull: { classes: name } }),
          Teacher.updateMany(
            { schoolId, classTeacherOf: name },
            { $set: { classTeacherOf: "", classTeacherSection: "", isClassTeacher: false } }
          ),
          // The class is gone, so its timetable rows ("<class> - <section>") and
          // scheduled exam papers are meaningless — remove them rather than orphan.
          Timetable.deleteMany({ schoolId, className: { $regex: `^${escapeRegex(name)} - ` } }),
          ScheduledExam.deleteMany({ schoolId, class: name }),
          // Drop the class from any multi-class exam (historical marks/attendance keep
          // their className as a record of what was — they're tied to the student).
          Exam.updateMany({ schoolId, classes: name }, { $pull: { classes: name } }),
        ]);

        res.status(204).send();
      } catch (err) {
        next(err);
      }
    });
  },
});
