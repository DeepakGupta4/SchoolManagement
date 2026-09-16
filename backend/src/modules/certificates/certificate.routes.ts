import { z } from "zod";
import { Certificate } from "./certificate.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const certificateSchema = z.object({
  student: z.string().min(1),
  admissionNo: z.string().default(""),
  className: z.string().default(""),
  type: z.string().default(""),
  requestedBy: z.string().default(""),
  requestedOn: z.string().default(""),
  issueDate: z.string().nullable().default(null),
  verificationCode: z.string().nullable().default(null),
  status: z.string().default("pending"),
});

export default createCrudRouter({
  model: Certificate,
  createSchema: certificateSchema,
  searchFields: ["student", "admissionNo", "requestedBy", "verificationCode"],
  filterFields: ["type", "status"],
  // Reference numbers continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `CR-${9000 + seq + 1}` }),
});
