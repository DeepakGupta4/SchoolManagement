import { z } from "zod";
import { StaffMember } from "./staff.model.js";
import { StoredDocument } from "../documents/document.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const staffSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(""),
  dept: z.string().default(""),
  type: z.string().default(""),
  status: z.string().default("active"),
  gender: z.string().default(""),
  dateOfBirth: z.string().default(""),
  qualification: z.string().default(""),
  experienceYears: z.coerce.number<number>().min(0).default(0),
  phone: z.string().default(""),
  email: z.string().default(""),
  address: z.string().default(""),
  join: z.string().default(""),
  salary: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: StaffMember,
  createSchema: staffSchema,
  searchFields: ["name", "role", "employeeId", "email"],
  filterFields: ["dept", "type", "status"],
  // Cascade: remove a staff member's uploaded documents when they're deleted.
  afterDelete: async (doc, req) => {
    await StoredDocument.deleteMany({
      schoolId: req.user!.schoolId,
      ownerType: "staff",
      ownerId: String(doc._id),
    }).catch(() => {});
  },
});
