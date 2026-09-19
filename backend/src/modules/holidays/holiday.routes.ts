import { z } from "zod";
import { Holiday } from "./holiday.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const holidaySchema = z.object({
  date: z.string().min(1),
  name: z.string().min(1),
  type: z.string().default("Holiday"),
});

export default createCrudRouter({
  model: Holiday,
  createSchema: holidaySchema,
  searchFields: ["name", "type"],
  filterFields: ["type"],
  sort: { date: 1 },
});
