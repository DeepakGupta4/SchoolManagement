import { z } from "zod";

export const holidaySchema = z.object({
  date: z.string().min(1, "Date is required"),
  name: z.string().min(1, "Name is required"),
  type: z.string(),
});

export type HolidaySchema = z.infer<typeof holidaySchema>;
