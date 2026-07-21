import { z } from "zod";

export const bookSchema = z
  .object({
    title: z.string().min(2, "Title is required"),
    author: z.string().min(2, "Author is required"),
    category: z.string().min(1, "Category is required"),
    isbn: z.string().min(5, "ISBN is required"),
    publisher: z.string().min(2, "Publisher is required"),
    year: z.coerce.number<number>().min(1800, "Enter a valid year").max(2100, "Enter a valid year"),
    total: z.coerce.number<number>().min(0, "Cannot be negative"),
    available: z.coerce.number<number>().min(0, "Cannot be negative"),
  })
  .refine((v) => v.available <= v.total, {
    message: "Available cannot exceed total copies",
    path: ["available"],
  });

export type BookSchema = z.infer<typeof bookSchema>;
