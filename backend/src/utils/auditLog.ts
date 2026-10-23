import mongoose, { Schema } from "mongoose";

/**
 * Append-only audit trail for sensitive platform-owner actions.
 * Never updated or deleted — only inserted.
 */
const auditSchema = new Schema(
  {
    action: { type: String, required: true, index: true },
    performedBy: { type: String, required: true }, // email of the actor
    targetSchoolId: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditSchema);

export async function writeAudit(entry: {
  action: string;
  performedBy: string;
  targetSchoolId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    await AuditLog.create(entry);
  } catch {
    // Audit failure must never break the actual request.
    console.error("[audit] failed to write:", entry.action);
  }
}

export { AuditLog };
