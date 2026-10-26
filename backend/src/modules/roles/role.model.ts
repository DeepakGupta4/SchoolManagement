import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A school-defined custom role. The built-in roles (super_admin, school_admin,
 * principal, teacher, accountant, …) are NOT stored here — they keep their fixed,
 * tested behaviour. A custom role is pure data: a name plus a permissions map of
 * moduleKey -> "none" | "view" | "edit" (see permissionModules.ts). A user carries
 * this role via `role: "custom"` + `customRoleKey` equal to this `key`.
 */

export const PERMISSION_LEVELS = ["none", "view", "edit"] as const;

const roleSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    /** Stable slug, unique per school — what a user's `customRoleKey` points at. */
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    /** moduleKey -> level. Stored as a plain object; absent keys mean "none". */
    permissions: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One role key per school (case-insensitive) — a user's customRoleKey resolves to
// exactly one role. Dedupe any duplicate keys before this index builds.
roleSchema.index({ schoolId: 1, key: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export type RoleAttrs = InferSchemaType<typeof roleSchema>;
export const Role = mongoose.model("Role", roleSchema);

roleSchema.on("index", (err) => {
  if (err) console.error("[Role] index build failed — dedupe duplicate role keys:", err.message);
});

/** Normalises a stored permissions value into a plain {moduleKey: level} object. */
export function permissionsOf(role: { permissions?: unknown } | null | undefined): Record<string, string> {
  const raw = role?.permissions;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
