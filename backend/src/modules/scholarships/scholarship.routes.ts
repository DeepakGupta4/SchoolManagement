import { z } from "zod";
import { Scholarship } from "./scholarship.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { syncStudentConcession } from "../fees/feeProvisioning.js";

const scholarshipSchema = z.object({
  code: z.string().min(1),
  student: z.string().min(1),
  // Optional link to a real student so the waiver can reduce their fee bill.
  // An empty string from the form is treated as "not linked".
  studentId: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().optional()
  ),
  class: z.string().default(""),
  type: z.string().default(""),
  percentage: z.coerce.number<number>().min(0).default(0),
  amount: z.coerce.number<number>().min(0).default(0),
  reason: z.string().default(""),
  status: z.string().default("pending"),
  since: z.string().default(""),
});

/** Re-bills the linked student whenever their scholarships change. */
const resync = async (
  doc: { studentId?: unknown },
  req: { user?: { schoolId: string } }
) => {
  const studentId = doc.studentId ? String(doc.studentId) : null;
  await syncStudentConcession(req.user!.schoolId, studentId);
};

export default createCrudRouter({
  model: Scholarship,
  createSchema: scholarshipSchema,
  searchFields: ["student", "code", "type", "class", "reason"],
  filterFields: ["status"],
  afterCreate: resync,
  afterUpdate: resync,
  afterDelete: resync,
});
