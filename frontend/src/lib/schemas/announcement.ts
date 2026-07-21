import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(3, "Title is required"),
  body: z.string().min(10, "Write at least a sentence"),
  author: z.string().min(2, "Author is required"),
  audience: z.array(z.string()).min(1, "Select at least one audience"),
  category: z.string().min(1, "Category is required"),
  pinned: z.boolean(),
  views: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;
