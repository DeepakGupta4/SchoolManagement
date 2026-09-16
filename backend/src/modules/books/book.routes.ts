import { z } from "zod";
import { Book } from "./book.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().default(""),
  category: z.string().default(""),
  total: z.coerce.number<number>().min(0).default(0),
  available: z.coerce.number<number>().min(0).default(0),
  isbn: z.string().default(""),
  publisher: z.string().default(""),
  year: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: Book,
  createSchema: bookSchema,
  searchFields: ["title", "author", "isbn"],
  filterFields: ["category"],
});
