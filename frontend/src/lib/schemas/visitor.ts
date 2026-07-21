import { z } from "zod";

export const visitorSchema = z.object({
  name: z.string().min(2, "Visitor name is required."),
  phone: z.string().min(6, "Phone number is required."),
  purpose: z.enum(
    [
      "Parent meeting",
      "Admission enquiry",
      "Vendor / delivery",
      "Maintenance",
      "Student pickup",
      "Official inspection",
    ],
    { error: "Select the purpose of the visit." }
  ),
  whomToMeet: z.string().min(2, "Enter the host or department."),
  status: z.enum(["inside", "checked-out", "expected"]),
  /** Free text; becomes `pickupFor` when the purpose is a student pickup. */
  notes: z.string(),
});

export type VisitorSchema = z.infer<typeof visitorSchema>;
