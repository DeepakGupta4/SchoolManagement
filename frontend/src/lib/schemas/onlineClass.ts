import { z } from "zod";

export const onlineClassSchema = z.object({
  topic: z.string().min(3, "Topic is required"),
  subject: z.string().min(1, "Subject is required"),
  teacher: z.string().min(2, "Teacher is required"),
  klass: z.string().min(1, "Class is required"),
  platform: z.string().min(1, "Platform is required"),
  state: z.string().min(1, "Status is required"),
  when: z.string().min(2, "Schedule is required"),
  duration: z.coerce.number<number>().min(5, "At least 5 minutes").max(240, "At most 240 minutes"),
  attendees: z.coerce.number<number>().min(0, "Cannot be negative"),
  link: z.string().min(1, "Joining link is required"),
  agenda: z.string().max(300, "Keep the agenda under 300 characters"),
});

export type OnlineClassSchema = z.infer<typeof onlineClassSchema>;

/**
 * Form-facing schema. The stored record keeps a single free-text `when`, but the
 * form collects a date + time separately (low typing, native pickers) and the
 * modal combines them on submit.
 */
export const onlineClassFormSchema = onlineClassSchema.omit({ when: true }).extend({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

export type OnlineClassFormSchema = z.infer<typeof onlineClassFormSchema>;

/** Combine the date + time controls into the stored `when` string. */
export function joinWhen(date: string, time: string): string {
  return [date, time].filter(Boolean).join(" ");
}

/** Split a stored `when` back into date + time for the edit form. */
export function splitWhen(when: string): { date: string; time: string } {
  const match = when?.match(/(\d{4}-\d{2}-\d{2})[ T]?(\d{2}:\d{2})?/);
  return { date: match?.[1] ?? "", time: match?.[2] ?? "" };
}
