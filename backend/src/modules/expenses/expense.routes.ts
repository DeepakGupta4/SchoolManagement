import { z } from "zod";
import { Expense } from "./expense.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const expenseSchema = z.object({
  voucherNo: z.string().min(1),
  title: z.string().min(1),
  category: z.string().default(""),
  amount: z.coerce.number<number>().min(0).default(0),
  date: z.string().default(""),
  paidTo: z.string().default(""),
  method: z.string().default(""),
  status: z.string().default("pending"),
  recurring: z.boolean().default(false),
  notes: z.string().default(""),
});

export default createCrudRouter({
  model: Expense,
  createSchema: expenseSchema,
  searchFields: ["title", "paidTo", "voucherNo", "category"],
  filterFields: ["status", "category"],
});
