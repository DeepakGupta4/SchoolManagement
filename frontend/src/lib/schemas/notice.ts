import { z } from "zod";

export const noticeSchema = z.object({
  title: z.string().min(3, "Title is required"),
  body: z.string().min(10, "Write at least a sentence"),
  category: z.string().min(1, "Category is required"),
  audience: z.array(z.string()).min(1, "Select at least one audience"),
  date: z.string().min(1, "Posting date is required"),
  expiry: z.string().min(1, "Expiry date is required"),
  pinned: z.boolean(),
  priority: z.string().min(1, "Priority is required"),
  postedBy: z.string().min(2, "Posted by is required"),
});

export type NoticeSchema = z.infer<typeof noticeSchema>;
