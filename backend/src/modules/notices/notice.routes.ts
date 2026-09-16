import { z } from "zod";
import { Notice } from "./notice.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const noticeSchema = z.object({
  title: z.string().min(1),
  body: z.string().default(""),
  category: z.string().default(""),
  audience: z.array(z.string()).default([]),
  date: z.string().default(""),
  expiry: z.string().default(""),
  pinned: z.boolean().default(false),
  priority: z.string().default("Medium"),
  postedBy: z.string().default(""),
});

export default createCrudRouter({
  model: Notice,
  createSchema: noticeSchema,
  searchFields: ["title", "body", "postedBy", "category"],
  filterFields: ["category", "priority"],
});
