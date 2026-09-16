import { z } from "zod";
import { Material } from "./studyMaterial.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const materialSchema = z.object({
  title: z.string().min(1),
  type: z.string().default(""),
  subject: z.string().default(""),
  klass: z.string().default(""),
  uploader: z.string().default(""),
  uploaded: z.string().default(""),
  sizeMb: z.coerce.number<number>().min(0).default(0),
  downloads: z.coerce.number<number>().min(0).default(0),
  visibility: z.string().default("draft"),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
});

export default createCrudRouter({
  model: Material,
  createSchema: materialSchema,
  searchFields: ["title", "subject", "uploader"],
  filterFields: ["type", "subject", "klass"],
});
