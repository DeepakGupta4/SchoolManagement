import { z } from "zod";
import { Application, APPLICATION_STAGES } from "./application.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";

// Empty, or a real YYYY-MM-DD date.
const optionalDate = z
  .union([
    z.literal(""),
    z.string().regex(ISO_DATE, "Use a YYYY-MM-DD date.").refine(isRealDate, "That date doesn't exist on the calendar."),
  ])
  .default("");

const applicationSchema = z.object({
  jobCode: z.string().default(""),
  jobTitle: z.string().default(""),
  name: z.string().min(1, "Candidate name is required."),
  email: z.string().default(""),
  phone: z.string().default(""),
  experience: z.string().default(""),
  appliedOn: optionalDate,
  stage: z.enum(APPLICATION_STAGES).default("applied"),
  note: z.string().default(""),
});

export default createCrudRouter({
  model: Application,
  createSchema: applicationSchema,
  searchFields: ["name", "email", "jobTitle", "jobCode"],
  filterFields: ["stage", "jobCode"],
  sort: { createdAt: -1 },
  // Candidate contact details are PII — office/HR only.
  readRoles: ["super_admin", "school_admin", "principal"],
});
