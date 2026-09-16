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
  filterFields: ["className", "day", "subject"],
});
