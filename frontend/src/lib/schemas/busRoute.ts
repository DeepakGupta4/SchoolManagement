import { z } from "zod";

export const busRouteSchema = z.object({
  code: z.string().trim().min(2, "Route code is required"),
  name: z.string().trim().min(3, "Route name is required"),
  stops: z.array(z.string()).min(1, "Select at least one stop"),
  driver: z.string().trim().min(2, "Driver is required"),
  bus: z.string().trim().min(4, "Bus number is required"),
  capacity: z.coerce.number<number>().min(1, "Must be at least 1"),
  students: z.coerce.number<number>().min(0, "Cannot be negative"),
  departure: z.string().trim().min(3, "Departure time is required"),
  arrival: z.string().trim().min(3, "Arrival time is required"),
  distance: z.string().trim().min(2, "Distance is required"),
  status: z.string().min(1, "Status is required"),
});

export type BusRouteSchema = z.infer<typeof busRouteSchema>;
