import { z } from "zod";
import { StudentDocument } from "./studentDocument.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const studentDocumentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  className: z.string().default(""),
  guardian: z.string().default(""),
  birthCert: z.string().default("missing"),
  aadhaar: z.string().default("missing"),
  tc: z.string().default("missing"),
  marksheets: z.string().default("missing"),
  photo: z.string().default("missing"),
});

export default createCrudRouter({
  model: StudentDocument,
  createSchema: studentDocumentSchema,
  searchFields: ["name", "studentId", "guardian"],
  filterFields: ["className"],
  // Student + guardian identity and per-slot document status — staff only
  // (was open to any authenticated role, leaking the roster to parents/drivers/etc.).
  readRoles: ["super_admin", "school_admin", "principal", "teacher", "accountant"],
});
