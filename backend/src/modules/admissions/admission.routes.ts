import { z } from "zod";
import { Application } from "./admission.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const admissionSchema = z.object({
  applicationNo: z.string().min(1),
  name: z.string().min(1),
  dateOfBirth: z.string().default(""),
  gender: z.string().default(""),
  classApplied: z.string().default(""),
  bloodGroup: z.string().default(""),
  category: z.string().default(""),
  previousSchool: z.string().default(""),
  parent: z.string().default(""),
  relation: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  address: z.string().default(""),
  source: z.string().default(""),
  appliedOn: z.string().default(""),
  stage: z.string().default("enquiry"),
  score: z.coerce.number<number>().min(0).default(0),
  notes: z.string().default(""),
});

export default createCrudRouter({
  model: Application,
  createSchema: admissionSchema,
  searchFields: ["name", "applicationNo", "parent", "phone"],
  filterFields: ["stage", "classApplied", "source"],
});
