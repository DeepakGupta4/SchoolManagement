import { z } from "zod";
import { ScheduledExam } from "./examSchedule.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const scheduleSchema = z.object({
  code: z.string().min(1),
  exam: z.string().default(""),
  subject: z.string().default(""),
  class: z.string().default(""),
  date: z.string().default(""),
  time: z.string().default(""),
  duration: z.string().default(""),
  room: z.string().default(""),
  invigilator: z.string().default(""),
  totalMarks: z.coerce.number<number>().min(0).default(0),
  status: z.string().default("upcoming"),
});

export default createCrudRouter({
  model: ScheduledExam,
  createSchema: scheduleSchema,
  searchFields: ["exam", "code", "subject", "class", "room", "invigilator"],
  filterFields: ["status"],
});
