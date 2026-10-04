import { z } from "zod";
import { Timetable } from "./timetable.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const timetableSchema = z.object({
  className: z.string().min(1),
  day: z.string().min(1),
  period: z.coerce.number<number>().min(1).default(1),
  time: z.string().default(""),
  subject: z.string().min(1),
  teacher: z.string().default(""),
  room: z.string().default(""),
});

export default createCrudRouter({
  model: Timetable,
  createSchema: timetableSchema,
  searchFields: ["className", "subject", "teacher", "room"],
  // `teacher` is an exact filter so a substitution screen can pull exactly one
  // teacher's periods for a day without substring-matching other names.
  filterFields: ["className", "day", "subject", "teacher"],
});
