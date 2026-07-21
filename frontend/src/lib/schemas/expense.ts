import { z } from "zod";

export const expenseSchema = z.object({
  voucherNo: z.string().min(3, "Voucher number is required"),
  title: z.string().min(3, "Title is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number<number>().min(1, "Amount must be greater than zero"),
  date: z.string().min(4, "Date is required"),
  paidTo: z.string().min(2, "Payee is required"),
  method: z.string().min(1, "Payment method is required"),
  status: z.string().min(1, "Status is required"),
  recurring: z.enum(["yes", "no"]),
  notes: z.string().max(300, "Keep notes under 300 characters"),
});

export type ExpenseSchema = z.infer<typeof expenseSchema>;
