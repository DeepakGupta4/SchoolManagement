import { z } from "zod";
import { isValidDateString, isWithin, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";

export const expenseSchema = z.object({
  voucherNo: z.string().min(3, "Voucher number is required"),
  title: z.string().min(3, "Title is required"),
  category: z.string().min(1, "Category is required"),
  // Coercion turns the number-input string into a number; `.positive()` rejects
  // both non-numeric (NaN) and zero/negative, and the cap rejects Infinity.
  amount: z.coerce
    .number<number>()
    .positive("Amount must be greater than zero")
    .max(100_000_000, "Amount looks too large"),
  // A real yyyy-mm-dd with a 4-digit year (rejects 6-digit garbage) that isn't
  // in the future — an expense is recorded once it has been incurred.
  date: z
    .string()
    .min(1, "Date is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((d) => isWithin(d, MIN_RECORD_DATE, TODAY_ISO), "Date can't be in the future"),
  paidTo: z.string().min(2, "Payee is required"),
  method: z.string().min(1, "Payment method is required"),
  status: z.string().min(1, "Status is required"),
  recurring: z.enum(["yes", "no"]),
  notes: z.string().max(300, "Keep notes under 300 characters"),
});

export type ExpenseSchema = z.infer<typeof expenseSchema>;
