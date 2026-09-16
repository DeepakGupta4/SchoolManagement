import { z } from "zod";
import { Visitor } from "./visitor.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const visitorSchema = z.object({
  name: z.string().min(1),
  phone: z.string().default(""),
  purpose: z.string().default(""),
  whomToMeet: z.string().default(""),
  inTime: z.string().default(""),
  outTime: z.string().nullable().default(null),
  passCode: z.string().default(""),
  status: z.string().default("inside"),
  pickupFor: z.string().nullable().default(null),
});

export default createCrudRouter({
  model: Visitor,
  createSchema: visitorSchema,
  searchFields: ["name", "phone", "whomToMeet", "passCode"],
  filterFields: ["purpose", "status"],
});
