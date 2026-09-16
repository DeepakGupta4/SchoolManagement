import { z } from "zod";
import { SchoolEvent } from "./event.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const eventSchema = z.object({
  name: z.string().min(1),
  category: z.string().default(""),
  date: z.string().default(""),
  venue: z.string().default(""),
  coordinator: z.string().default(""),
  participants: z.coerce.number<number>().min(0).default(0),
  capacity: z.coerce.number<number>().min(0).default(0),
  registration: z.string().default("open"),
  status: z.string().default("upcoming"),
  mediaCount: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: SchoolEvent,
  createSchema: eventSchema,
  searchFields: ["name", "venue", "coordinator", "code"],
  filterFields: ["category", "status"],
  // Reference numbers continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `EV-${2400 + seq + 1}` }),
});
