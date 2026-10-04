import { z } from "zod";
import { Teacher } from "./teacher.model.js";
import { StoredDocument } from "../documents/document.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { ISO_DATE, isRealDate, serverToday, maxToday } from "../../utils/dates.js";

const PHONE = /^\d{10}$/;

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
