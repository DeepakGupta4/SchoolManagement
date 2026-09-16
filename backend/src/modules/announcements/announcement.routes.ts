import { z } from "zod";
import { Announcement } from "./announcement.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const announcementSchema = z.object({
  title: z.string().min(1),
  body: z.string().default(""),
  author: z.string().default(""),
  audience: z.array(z.string()).default([]),
  category: z.string().default(""),
  date: z.string().default(""),
  pinned: z.boolean().default(false),
  views: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: Announcement,
  createSchema: announcementSchema,
  searchFields: ["title", "body", "author", "category"],
  filterFields: ["category"],
});
