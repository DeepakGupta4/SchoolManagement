import { z } from "zod";
import { Role, PERMISSION_LEVELS } from "./role.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

// permissions is an open map of moduleKey -> level. Unknown keys are harmless
// (the gate only reads known modules), so we don't enum-restrict the keys here.
const roleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Role key is required")
    .regex(/^[a-z0-9-]+$/, "Key must be lowercase letters, numbers or hyphens"),
  name: z.string().trim().min(2, "Role name is required"),
  description: z.string().trim().default(""),
  permissions: z.record(z.string(), z.enum(PERMISSION_LEVELS)).default({}),
  isActive: z.boolean().default(true),
});

// Only account admins manage roles — never a custom role itself (role management
// is intentionally NOT a grantable module, so a custom user can't escalate).
export default createCrudRouter({
  model: Role,
  createSchema: roleSchema,
  searchFields: ["name", "key"],
  // Role management is an account-owner function (like user management) — not the
  // principal, and never a custom role (role mgmt isn't a grantable module).
  writeRoles: ["super_admin", "school_admin"],
  readRoles: ["super_admin", "school_admin"],
});
