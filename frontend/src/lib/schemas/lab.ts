import { z } from "zod";

export const labSchema = z.object({
  name: z.string().min(2, "Lab name is required"),
  type: z.enum(["Physics", "Chemistry", "Biology", "Computer"]),
  block: z.string().min(2, "Block / location is required"),
  capacity: z.coerce.number<number>().min(0, "Cannot be negative"),
  inCharge: z.string().min(2, "Lab in-charge is required"),
  assistant: z.string().min(2, "Lab assistant is required"),
  equipmentTotal: z.coerce.number<number>().min(0, "Cannot be negative"),
  equipmentWorking: z.coerce.number<number>().min(0, "Cannot be negative"),
  weeklyPracticals: z.coerce.number<number>().min(0, "Cannot be negative"),
  nextPractical: z.string().min(1, "Next practical date is required"),
  nextPracticalClass: z.string().min(2, "Practical details are required"),
  status: z.enum(["operational", "maintenance", "closed"]),
}).refine((v) => v.equipmentWorking <= v.equipmentTotal, {
  message: "Cannot exceed total equipment",
  path: ["equipmentWorking"],
});

export type LabSchema = z.infer<typeof labSchema>;
