import { z } from "zod";
import { JobPosting } from "./jobPosting.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const jobPostingSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  dept: z.string().default(""),
  type: z.string().default(""),
  posted: z.string().default(""),
  deadline: z.string().default(""),
  applicants: z.coerce.number<number>().min(0).default(0),
  status: z.string().default("Open"),
});

export default createCrudRouter({
  model: JobPosting,
  createSchema: jobPostingSchema,
  searchFields: ["title", "code", "dept"],
  filterFields: ["dept", "status"],
});
