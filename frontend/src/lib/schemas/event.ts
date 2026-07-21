import { z } from "zod";

export const eventSchema = z
  .object({
    name: z.string().min(3, "Event name is required"),
    category: z.enum(["Cultural", "Sports", "Academic", "Competition"]),
    date: z.string().min(1, "Event date is required"),
    venue: z.string().min(2, "Venue is required"),
    coordinator: z.string().min(2, "Coordinator is required"),
    participants: z.coerce.number<number>().min(0, "Cannot be negative"),
    capacity: z.coerce.number<number>().min(1, "Capacity must be at least 1"),
    registration: z.enum(["open", "closing-soon", "closed", "not-required"]),
    status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
    mediaCount: z.coerce.number<number>().min(0, "Cannot be negative"),
  })
  .refine((v) => v.participants <= v.capacity, {
    message: "Cannot exceed the venue capacity",
    path: ["participants"],
  });

export type EventSchema = z.infer<typeof eventSchema>;
