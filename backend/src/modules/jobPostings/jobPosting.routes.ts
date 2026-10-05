import { z } from "zod";
import { JobPosting } from "./jobPosting.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";

// Empty, or a real YYYY-MM-DD date (deadline >= posted is enforced client-side).
const optionalDate = z
  .union([
    z.literal(""),
    z.string().regex(ISO_DATE, "Use a YYYY-MM-DD date.").refine(isRealDate, "That date doesn't exist on the calendar."),
  ])
  .default("");

const jobPostingSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  dept: z.string().default(""),
  type: z.string().default(""),
  posted: optionalDate,
  deadline: optionalDate,
  applicants: z.coerce.number<number>().min(0).default(0),
  status: z.enum(["Open", "Closed"]).default("Open"),
});

export default createCrudRouter({
  model: JobPosting,
  createSchema: jobPostingSchema,
  searchFields: ["title", "code", "dept"],
  filterFields: ["dept", "status"],
});
