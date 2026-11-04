import { z } from "zod";
import crypto from "node:crypto";
import type { HydratedDocument } from "mongoose";
import { Certificate, type CertificateAttrs } from "./certificate.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { serverToday } from "../../utils/dates.js";

const certificateSchema = z.object({
  student: z.string().min(1),
  admissionNo: z.string().default(""),
  className: z.string().default(""),
  section: z.string().default(""),
  rollNo: z.string().default(""),
  studentId: z.string().default(""),
  fatherName: z.string().default(""),
  dob: z.string().default(""),
  session: z.string().default(""),
  type: z.string().default(""),
  requestedBy: z.string().default(""),
  requestedOn: z.string().default(""),
  // issueDate + verificationCode are SERVER-stamped on issue (stampIfIssued) and are
  // NOT accepted from the client, so a printed "scan to verify" code can't be forged
  // or set to an arbitrary/duplicate value. status still flows (pending/issued/rejected).
  status: z.string().default("pending"),
});

/** An unguessable, human-readable code: VC-XXXX-XXXX (no ambiguous characters). */
function genVerificationCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  return `VC-${pick(4)}-${pick(4)}`;
}

/**
 * Server-stamps a certificate the moment it becomes "issued": an unguessable
 * verification code and the issue date, both server-owned so the printed code is
 * authentic. Idempotent — re-saving an already-stamped certificate changes nothing.
 */
async function stampIfIssued(doc: HydratedDocument<CertificateAttrs>): Promise<void> {
  if (doc.status !== "issued") return;
  let changed = false;
  if (!doc.verificationCode) {
    doc.verificationCode = genVerificationCode();
    changed = true;
  }
  if (!doc.issueDate) {
    doc.issueDate = serverToday();
    changed = true;
  }
  if (changed) await doc.save();
}

export default createCrudRouter<CertificateAttrs>({
  model: Certificate,
  createSchema: certificateSchema,
  searchFields: ["student", "admissionNo", "rollNo", "requestedBy", "verificationCode"],
  filterFields: ["type", "status", "className"],
  readRoles: ["super_admin", "school_admin", "principal", "accountant"],
  // Reference numbers continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `CR-${9000 + seq + 1}` }),
  // Stamp on both paths: issuing via an update is the normal flow, but a direct
  // create-as-issued is also covered.
  afterCreate: stampIfIssued,
  afterUpdate: stampIfIssued,
});
