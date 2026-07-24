import { z } from "zod";
import { Teacher } from "./teacher.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const PHONE = /^[6-9]\d{9}$/;

const teacherSchema = z.object({
  employeeId: z.string().min(1),
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().min(1),
  joiningDate: z.string().min(1),
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
});

export default createCrudRouter({
  model: Teacher,
  createSchema: teacherSchema,
  searchFields: ["firstName", "lastName", "employeeId", "email", "department"],
  filterFields: ["department", "status", "employmentType"],
});
