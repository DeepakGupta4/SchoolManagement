import { z } from "zod";
import { PHONE_REGEX, PHONE_MESSAGE } from "@/lib/phone";

export const parentSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  relation: z.enum(["Father", "Mother", "Guardian"], { error: "Select a relation" }),
  phone: z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
  email: z.email("Enter a valid email address"),
  occupation: z.string().trim(),
  address: z.string().trim(),
  isPrimary: z.boolean(),
  isEmergencyContact: z.boolean(),
  isPickupAuthorized: z.boolean(),
  /** Linked student ids. Optional — a parent can be added before children are linked. */
  students: z.array(z.string()),
});

export type ParentSchema = z.infer<typeof parentSchema>;
