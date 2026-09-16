import { z } from "zod";
import { Patient } from "./patient.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const patientSchema = z.object({
  name: z.string().min(1),
  class: z.string().default("—"),
  issue: z.string().default(""),
  status: z.string().default("Under Treatment"),
  date: z.string().default(""),
  doctor: z.string().default(""),
  type: z.string().default("Student"),
});

export default createCrudRouter({
  model: Patient,
  createSchema: patientSchema,
  searchFields: ["name", "issue", "code", "doctor", "class"],
  filterFields: ["status", "type"],
  // Patient references continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `P${String(seq + 1).padStart(3, "0")}` }),
});
