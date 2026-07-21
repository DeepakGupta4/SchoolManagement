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
