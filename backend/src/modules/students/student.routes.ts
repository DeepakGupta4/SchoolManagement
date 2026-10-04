import { z } from "zod";
import mongoose from "mongoose";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { Student } from "./student.model.js";
import { FeeAccount, Payment } from "../fees/fee.model.js";
import { StoredDocument } from "../documents/document.model.js";
import { SchoolClass } from "../classes/class.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { ISO_DATE, isRealDate, serverToday, maxToday } from "../../utils/dates.js";

const PHONE = /^\d{10}$/;

const guardianSchema = z.object({
  name: z.string().min(2, "Guardian name is required"),
  relation: z.string().min(1, "Relation is required"),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  email: z.union([z.email(), z.literal("")]).optional(),
  occupation: z.string().optional(),
});

const studentSchema = z.object({
  admissionNo: z.string().min(1),
  rollNo: z.string().min(1),
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  dateOfBirth: z
    .string()
    .min(1)
    .regex(ISO_DATE, "Date of birth must be YYYY-MM-DD")
    .refine(isRealDate, "Enter a valid date of birth")
    .refine((d) => d >= "1900-01-01" && d <= serverToday(), "Date of birth is out of range"),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).nullable().optional(),
  className: z.string().min(1),
  section: z.string().min(1),
  status: z.enum(["active", "inactive", "alumni", "transferred"]).default("active"),
  admissionDate: z
    .string()
    .min(1)
    .regex(ISO_DATE, "Admission date must be YYYY-MM-DD")
    .refine(isRealDate, "Enter a valid admission date")
    .refine((d) => d <= maxToday(), "Admission date can't be in the future"),
  address: z.string().min(5),
  guardian: guardianSchema,
  avatar: z.string().optional(),
  medicalNotes: z.string().optional(),

  // Optional admission-form details — all backward-compatible. Phone-like
  // fields are plain strings (no 10-digit regex) so they accept any input.
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherPhone: z.string().optional().refine((v) => !v || PHONE.test(v), "Enter a valid 10-digit number"),
  fatherEmail: z.union([z.email(), z.literal("")]).optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherPhone: z.string().optional().refine((v) => !v || PHONE.test(v), "Enter a valid 10-digit number"),
  motherEmail: z.union([z.email(), z.literal("")]).optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  category: z.string().optional(),
  motherTongue: z.string().optional(),
  aadhaarNo: z.string().optional().refine((v) => !v || /^\d{12}$/.test(v), "Aadhaar must be a 12-digit number"),
  placeOfBirth: z.string().optional(),
  annualIncome: z.string().optional(),
  correspondenceAddress: z.string().optional(),
  emergencyContact: z.string().optional(),
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  previousBoard: z.string().optional(),
  tcNumber: z.string().optional(),
  previousResult: z.string().optional(),
  transportRequired: z.boolean().optional(),
  pickupPoint: z.string().optional(),
});

// End-of-session class promotion, scoped to the caller's school so one tenant can
// never move another's students. `session` makes the whole batch idempotent.
const promoteSchema = z.object({
  session: z.string().min(1, "Academic session is required"),
  promotions: z
    .array(
      z
        .object({
          studentId: z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid student id"),
          action: z.enum(["promote", "retain", "graduate"]),
          toClass: z.string().min(1).optional(),
        })
        .refine((p) => p.action !== "promote" || !!p.toClass, {
          message: "toClass is required to promote a student",
          path: ["toClass"],
        })
    )
    .min(1, "Nothing to apply")
    .max(5000, "Too many students in one batch"),
});

export default createCrudRouter({
  model: Student,
  createSchema: studentSchema,
  searchFields: ["firstName", "lastName", "admissionNo", "email", "rollNo"],
  filterFields: ["className", "status", "section"],
  notifyOnCreate: (s) => ({
    type: "student",
    title: "New student admitted",
    body: `${s.firstName} ${s.lastName} · ${s.className}-${s.section}`,
    link: "/students",
  }),
  // Cascade: removing a student also removes their fee account, payments and
  // uploaded documents, so no orphan records linger (e.g. in Fee Defaulters).
  afterDelete: async (doc, req) => {
    const schoolId = req.user!.schoolId;
    const studentId = doc._id;
    await Promise.all([
      FeeAccount.deleteMany({ schoolId, studentId }).catch(() => {}),
      Payment.deleteMany({ schoolId, studentId }).catch(() => {}),
      StoredDocument.deleteMany({
        schoolId,
        ownerType: "student",
        ownerId: String(studentId),
      }).catch(() => {}),
    ]);
  },
  // Custom bulk-promote route. `extend` runs after createCrudRouter's
  // `router.use(requireAuth)`, so the callers here are already authenticated.
  extend: (router) => {
    router.post(
      "/promote",
      requireRole("super_admin", "school_admin", "principal"),
      validate(promoteSchema),
      async (req, res, next) => {
        try {
          const { session, promotions } = req.body as z.infer<typeof promoteSchema>;
          const schoolId = req.user!.schoolId;

          // Every promote target must be a real class for THIS school — never trust
          // a client-supplied className (it's an indexed roster filter). One check
          // up front so a bad class fails the whole batch cleanly.
          const validClasses = new Set<string>(await SchoolClass.find({ schoolId }).distinct("name"));
          for (const p of promotions) {
            if (p.action === "promote" && !validClasses.has(p.toClass!)) {
              throw ApiError.badRequest(`Unknown class: "${p.toClass}". Create it in Classes & Sections first.`);
            }
          }

          // Only ACTIVE students in this school are eligible. Alumni/transferred/
          // inactive and other-tenant ids are ignored (counted as skipped), so a
          // departed student is never silently re-promoted.
          const ids = promotions.map((p) => new mongoose.Types.ObjectId(p.studentId));
          const students = await Student.find({ _id: { $in: ids }, schoolId, status: "active" }).select(
            "status lastPromotedSession"
          );
          const eligible = new Set(
            students.filter((s) => s.lastPromotedSession !== session).map((s) => String(s._id))
          );

          // Idempotency + eligibility: skip anything already processed for this
          // session, so a double-click or re-apply can't cascade a second class.
          const decisions = promotions.filter((p) => eligible.has(p.studentId));

          // Roll reassignment for promotes: continue each destination class's
          // numbering after its current highest active roll, so promoted students
          // never collide with students already in that class (no unique index).
          const targets = [...new Set(decisions.filter((p) => p.action === "promote").map((p) => p.toClass!))];
          const nextRoll = new Map<string, number>();
          for (const cls of targets) {
            const inClass = await Student.find({ schoolId, className: cls, status: "active" }).select("rollNo");
            const max = inClass.reduce((m, s) => {
              const n = parseInt(String(s.rollNo).replace(/\D/g, ""), 10);
              return Number.isNaN(n) ? m : Math.max(m, n);
            }, 0);
            nextRoll.set(cls, max);
          }

          let promoted = 0;
          let retained = 0;
          let graduated = 0;
          const ops: Parameters<typeof Student.bulkWrite>[0] = [];

          for (const p of decisions) {
            if (p.action === "retain") {
              retained += 1;
              ops.push({
                updateOne: {
                  filter: { _id: p.studentId, schoolId },
                  update: { $set: { lastPromotedSession: session } },
                },
              });
            } else if (p.action === "graduate") {
              graduated += 1;
              ops.push({
                updateOne: {
                  filter: { _id: p.studentId, schoolId },
                  update: { $set: { status: "alumni", lastPromotedSession: session } },
                },
              });
            } else {
              const cls = p.toClass!;
              const roll = (nextRoll.get(cls) ?? 0) + 1;
              nextRoll.set(cls, roll);
              promoted += 1;
              ops.push({
                updateOne: {
                  filter: { _id: p.studentId, schoolId },
                  update: { $set: { className: cls, rollNo: String(roll), lastPromotedSession: session } },
                },
              });
            }
          }

          // One round-trip for the whole batch (not N sequential updates), so the
          // failure window is tiny and the operation is far faster at scale.
          if (ops.length > 0) await Student.bulkWrite(ops);

          const skipped = promotions.length - decisions.length;
          res.json({ data: { promoted, retained, graduated, skipped } });
        } catch (err) {
          next(err);
        }
      }
    );
  },
});
