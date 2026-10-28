import { z } from "zod";
import { Assignment } from "./assignment.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const assignmentSchema = z.object({
  title: z.string().min(1),
  subject: z.string().default(""),
  class: z.string().default(""),
  teacher: z.string().default(""),
  given: z.string().default(""),
  due: z.string().default(""),
  totalMarks: z.coerce.number<number>().min(0).default(0),
  submitted: z.coerce.number<number>().min(0).default(0),
  total: z.coerce.number<number>().min(0).default(0),
  status: z.string().default("upcoming"),
  type: z.string().default(""),
  description: z.string().default(""),
  // ~3.5 MB of file as base64 (global body cap is 5 MB; base64 is ~+33%). A clean
  // 400 here beats an Express 413.
  fileDataUrl: z.string().max(4_900_000, "Attachment is too large (max ~3.5 MB).").default(""),
  fileName: z.string().default(""),
  mimeType: z.string().default(""),
  fileSize: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: Assignment,
  createSchema: assignmentSchema,
  searchFields: ["title", "subject", "class", "teacher", "code"],
  filterFields: ["status", "class"],
  writeRoles: ["super_admin", "school_admin", "principal", "teacher"],
  // Keep the base64 attachment out of list responses — fetched only on detail.
  listSelect: "-fileDataUrl",
  // Reference numbers continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `A${String(seq + 1).padStart(3, "0")}` }),
  // Tell the class when homework is posted (students + parents of that class).
  notifyOnCreate: (a) => ({
    type: "assignment",
    title: "New homework",
    body: `${a.title}${a.subject ? ` · ${a.subject}` : ""}${a.due ? ` · due ${a.due}` : ""}`,
    link: "/assignments",
    className: a.class,
    roles: ["student", "parent"],
  }),
});
