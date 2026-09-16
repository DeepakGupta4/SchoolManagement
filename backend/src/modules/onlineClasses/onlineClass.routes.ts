import { z } from "zod";
import { OnlineClass } from "./onlineClass.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const onlineClassSchema = z.object({
  topic: z.string().min(1),
  subject: z.string().default(""),
  teacher: z.string().default(""),
  klass: z.string().default(""),
  platform: z.string().default(""),
  state: z.string().default("scheduled"),
  when: z.string().default(""),
  duration: z.coerce.number<number>().min(0).default(0),
  attendees: z.coerce.number<number>().min(0).default(0),
  link: z.string().default(""),
  agenda: z.string().default(""),
});

export default createCrudRouter({
  model: OnlineClass,
  createSchema: onlineClassSchema,
  searchFields: ["topic", "subject", "teacher", "klass"],
  filterFields: ["subject", "teacher", "state"],
});
