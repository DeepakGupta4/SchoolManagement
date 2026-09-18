import { z } from "zod";
import { PHONE_REGEX, PHONE_MESSAGE } from "@/lib/phone";

export const alumnusSchema = z.object({
  name: z.string().min(2, "Name is required"),
  batch: z.string().regex(/^\d{4}$/, "Batch must be a four-digit year"),
  stream: z.string().min(1, "Stream is required"),
  occupation: z.string().min(2, "Occupation is required"),
  employer: z.string().min(2, "Employer is required"),
  city: z.string().min(2, "City is required"),
  email: z.email("Enter a valid email address"),
  phone: z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
  mentor: z.enum(["yes", "no"]),
  interests: z.array(z.string()),
});

export type AlumnusSchema = z.infer<typeof alumnusSchema>;
