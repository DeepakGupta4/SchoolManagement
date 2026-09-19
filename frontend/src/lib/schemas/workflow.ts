import { z } from "zod";

export const workflowSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  description: z.string(),
  trigger: z.enum([
    "attendance_low",
    "fee_overdue",
    "birthday_today",
    "admission_pending",
  ]),
  threshold: z.coerce.number<number>().min(1, "Enter a percentage").max(100),
  enabled: z.boolean(),
});

export type WorkflowSchema = z.infer<typeof workflowSchema>;
