import { z } from "zod";
import { Message } from "./message.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string().default(""),
  subject: z.string().default(""),
  body: z.string().default(""),
  category: z.string().default("Direct"),
  time: z.string().default(""),
  unread: z.coerce.number<number>().min(0).default(0),
  online: z.boolean().default(false),
  read: z.boolean().default(false),
});

export default createCrudRouter({
  model: Message,
  createSchema,
  searchFields: ["name", "role", "subject", "body"],
  filterFields: ["category"],
});
