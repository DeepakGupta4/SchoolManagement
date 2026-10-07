import { z } from "zod";
import { Teacher } from "./teacher.model.js";
import { StoredDocument } from "../documents/document.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { ISO_DATE, isRealDate, serverToday, maxToday } from "../../utils/dates.js";

const PHONE = /^\d{10}$/;

// A performance review persists rating + a note; rating is otherwise server-owned
// and never accepted by the generic create/update.
const reviewSchema = z.object({
  rating: z.coerce.number<number>().min(0).max(5),
  note: z.string().max(2000).default(""),
});

const teacherSchema = z.object({
  employeeId: z.string().min(1),
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z
    .string()
    .min(1)
    .regex(ISO_DATE, "Date of birth must be YYYY-MM-DD")
    .refine(isRealDate, "Enter a valid date of birth")
    .refine((d) => d >= "1900-01-01" && d <= serverToday(), "Date of birth is out of range"),
  joiningDate: z
    .string()
    .min(1)
    .regex(ISO_DATE, "Joining date must be YYYY-MM-DD")
    .refine(isRealDate, "Enter a valid joining date")
    .refine((d) => d >= "1970-01-01" && d <= maxToday(), "Joining date can't be in the future"),
  department: z.string().min(1),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  classes: z.array(z.string()).default([]),
  qualification: z.string().min(2),
  experienceYears: z.coerce.number<number>().min(0).max(60),
  employmentType: z.enum(["full-time", "part-time", "contract", "visiting"]),
  status: z.enum(["active", "on-leave", "inactive", "resigned"]).default("active"),
  address: z.string().min(5),
  avatar: z.string().optional(),
  salary: z.coerce.number<number>().min(0),
  isClassTeacher: z.boolean().default(false),
  classTeacherOf: z.string().optional(),
  classTeacherSection: z.string().optional(),
});

export default createCrudRouter({
  model: Teacher,
  createSchema: teacherSchema,
  searchFields: ["firstName", "lastName", "employeeId", "email", "department"],
  // `subjects` matches by array membership in Mongo, so it's a real server filter.
  filterFields: ["department", "status", "employmentType", "subjects"],
  // Staff records carry salary + PII — restrict reads to the office/HR; the write
  // roles already default to office roles.
  readRoles: ["super_admin", "school_admin", "principal", "accountant"],
  // Performance review: persist a rating + note (rating is otherwise read-only).
  extend: (router) => {
    router.post(
      "/:id/review",
      requireRole("super_admin", "school_admin", "principal"),
      validate(reviewSchema),
      async (req, res, next) => {
        try {
          const { rating, note } = req.body as z.infer<typeof reviewSchema>;
          const doc = await Teacher.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user!.schoolId },
            { $set: { rating, reviewNote: note, reviewedAt: serverToday(), reviewedBy: req.user!.email } },
            { new: true }
          );
          if (!doc) throw ApiError.notFound("Teacher not found.");
          res.json({
            data: {
              id: String(doc._id),
              rating: doc.rating,
              reviewNote: doc.reviewNote,
              reviewedAt: doc.reviewedAt,
              reviewedBy: doc.reviewedBy,
            },
          });
        } catch (err) {
          next(err);
        }
      }
    );
  },
  notifyOnCreate: (t) => ({
    type: "teacher",
    title: "New staff member added",
    body: `${t.firstName} ${t.lastName} · ${t.department}`,
    link: "/teachers",
  }),
  // Removing a teacher also removes their uploaded documents (qualification cert,
  // government ID), so no orphaned PII lingers.
  afterDelete: async (doc, req) => {
    const schoolId = req.user!.schoolId;
    await StoredDocument.deleteMany({
      schoolId,
      ownerType: "teacher",
      ownerId: String(doc._id),
    }).catch(() => {});
  },
});
