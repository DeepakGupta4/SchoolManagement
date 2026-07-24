import { z } from "zod";
import { Student } from "./student.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const PHONE = /^[6-9]\d{9}$/;

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
  dateOfBirth: z.string().min(1),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).nullable().optional(),
  className: z.string().min(1),
  section: z.string().min(1),
  status: z.enum(["active", "inactive", "alumni", "transferred"]).default("active"),
  admissionDate: z.string().min(1),
  address: z.string().min(5),
  guardian: guardianSchema,
  avatar: z.string().optional(),
  medicalNotes: z.string().optional(),
});

export default createCrudRouter({
  model: Student,
  createSchema: studentSchema,
  searchFields: ["firstName", "lastName", "admissionNo", "email", "rollNo"],
  filterFields: ["className", "status", "section"],
});
