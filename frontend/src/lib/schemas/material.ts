import { z } from "zod";

export const materialSchema = z.object({
  title: z.string().min(3, "Title is required"),
  type: z.string().min(1, "Type is required"),
  subject: z.string().min(1, "Subject is required"),
  klass: z.string().min(1, "Class is required"),
  uploader: z.string().min(2, "Uploader is required"),
  uploaded: z.string().min(4, "Upload date is required"),
  sizeMb: z.coerce.number<number>().min(0.1, "Size must be greater than zero"),
  downloads: z.coerce.number<number>().min(0, "Cannot be negative"),
  visibility: z.string().min(1, "Visibility is required"),
  description: z.string().max(300, "Keep the description under 300 characters"),
  tags: z.array(z.string()),
});

export type MaterialSchema = z.infer<typeof materialSchema>;
