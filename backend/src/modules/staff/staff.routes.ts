import { z } from "zod";
import { StaffMember } from "./staff.model.js";
import { StoredDocument } from "../documents/document.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { ISO_DATE, isRealDate, maxToday } from "../../utils/dates.js";

// Empty, or a real YYYY-MM-DD date no later than today (DOB / joining are past dates).
const pastDate = z
  .union([
    z.literal(""),
    z
      .string()
      .regex(ISO_DATE, "Use a YYYY-MM-DD date.")
      .refine(isRealDate, "That date doesn't exist on the calendar.")
      .refine((d) => d >= "1900-01-01" && d <= maxToday(), "Date is out of range."),
  ])
  .default("");

const staffSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1, "Role is required."),
  dept: z.string().min(1, "Department is required."),
  type: z.string().min(1, "Employment type is required."),
  status: z.string().default("active"),
  gender: z.string().min(1, "Gender is required."),
  dateOfBirth: pastDate,
  qualification: z.string().default(""),
  experienceYears: z.coerce.number<number>().min(0).default(0),
  phone: z.string().default(""),
  email: z.string().default(""),
  address: z.string().default(""),
  join: pastDate,
  salary: z.coerce.number<number>().min(0).default(0),
  avatar: z.string().default(""),
});

export default createCrudRouter({
  model: StaffMember,
  createSchema: staffSchema,
  searchFields: ["name", "role", "employeeId", "email"],
  filterFields: ["dept", "type", "status"],
  // Staff records carry salary + PII — restrict reads to office/HR roles.
  readRoles: ["super_admin", "school_admin", "principal", "accountant"],
  // Cascade: remove a staff member's uploaded documents when they're deleted.
  afterDelete: async (doc, req) => {
    await StoredDocument.deleteMany({
      schoolId: req.user!.schoolId,
      ownerType: "staff",
      ownerId: String(doc._id),
    }).catch(() => {});
  },
});
