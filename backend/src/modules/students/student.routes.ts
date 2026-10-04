import { z } from "zod";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { Student } from "./student.model.js";
import { FeeAccount, Payment } from "../fees/fee.model.js";
import { StoredDocument } from "../documents/document.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const PHONE = /^\d{10}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// Server time is fine for a date BOUND (off-by-one at a timezone edge is harmless).
const serverToday = () => new Date().toISOString().slice(0, 10);

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
    .refine((d) => !Number.isNaN(Date.parse(d)), "Enter a valid date of birth")
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
    .refine((d) => !Number.isNaN(Date.parse(d)) && d <= serverToday(), "Admission date can't be in the future"),
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

// End-of-session class promotion. Each decision is applied individually and
// scoped to the caller's school so one tenant can never move another's students.
const promoteSchema = z.object({
  promotions: z
    .array(
      z
        .object({
          studentId: z.string().min(1),
          action: z.enum(["promote", "retain", "graduate"]),
          toClass: z.string().min(1).optional(),
        })
        .refine((p) => p.action !== "promote" || !!p.toClass, {
          message: "toClass is required to promote a student",
          path: ["toClass"],
        })
    )
    .min(1, "Nothing to apply"),
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
          const { promotions } = req.body as z.infer<typeof promoteSchema>;
          const schoolId = req.user!.schoolId;

          let promoted = 0;
          let retained = 0;
          let graduated = 0;

          for (const p of promotions) {
            if (p.action === "retain") {
              retained += 1;
              continue;
            }
            const update =
              p.action === "promote"
                ? { className: p.toClass }
                : { status: "alumni" as const };
            const result = await Student.updateOne({ _id: p.studentId, schoolId }, { $set: update });
            if (result.matchedCount > 0) {
              if (p.action === "promote") promoted += 1;
              else graduated += 1;
            }
          }

          res.json({ data: { promoted, retained, graduated } });
        } catch (err) {
          next(err);
        }
      }
    );
  },
});
