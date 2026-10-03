import { createApiResource } from "./createApiResource";

export type CertificateType = "Transfer" | "Bonafide" | "Character" | "Migration";
export type CertificateStatus = "pending" | "in-review" | "issued" | "rejected";

export interface Certificate {
  id: string;
  /** Human-facing reference shown in the UI, e.g. "CR-9001". The `id` is
   *  internal and must never be displayed. */
  code: string;
  student: string;
  admissionNo: string;
  className: string;
  type: CertificateType;
  requestedBy: string;
  /** ISO date, e.g. "2026-07-14". */
  requestedOn: string;
  issueDate: string | null;
  verificationCode: string | null;
  status: CertificateStatus;
  /** Optional, back-compatible fields populated from the student record so the
   *  printed certificate reads with real data rather than placeholders. */
  section?: string;
  rollNo?: string;
  /** Linked student record id, if picked from the roster. */
  studentId?: string;
  /** Guardian / father's name, for "Ward of …" in the certificate body. */
  fatherName?: string;
  /** ISO date of birth, shown on bonafide/character certificates. */
  dob?: string;
  /** Academic session, e.g. "2025-26". */
  session?: string;
}

export interface CertificateFilters {
  search?: string;
  type?: string;
  status?: string;
  className?: string;
}

export const CERTIFICATE_TYPE_OPTIONS: { label: string; value: CertificateType }[] = [
  { label: "Transfer", value: "Transfer" },
  { label: "Bonafide", value: "Bonafide" },
  { label: "Character", value: "Character" },
  { label: "Migration", value: "Migration" },
];

export const CERTIFICATE_STATUS_OPTIONS: { label: string; value: CertificateStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "In review", value: "in-review" },
  { label: "Issued", value: "issued" },
  { label: "Rejected", value: "rejected" },
];

/** "2026-07-21" — the ISO form every certificate date is stored in. Local time
 *  (not UTC), so the issue date is never a day behind in the IST morning. */
export const todayIso = () => {
  const d = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/**
 * Academic session like "2025-26". Indian sessions roll over in April, so a date
 * in Jan–Mar still belongs to the session that began the previous April. Computed
 * once at module load (like TODAY_ISO in lib/dates) so it stays pure in render.
 */
function academicSession(d: Date): string {
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 3 ? y : y - 1; // month 3 === April
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
export const CURRENT_SESSION = academicSession(new Date());

/** "VC-8KD2-91XM" — printed under the QR code on the issued certificate. */
export const makeVerificationCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  const block = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `VC-${block(4)}-${block(4)}`;
};

/** Printed title + one-line intent for each certificate type. */
export const CERTIFICATE_DOC_META: Record<CertificateType, { title: string; purpose: string }> = {
  Bonafide: {
    title: "Bonafide Certificate",
    purpose: "issued on request for official and administrative purposes.",
  },
  Transfer: {
    title: "Transfer Certificate",
    purpose: "issued at the request of the parent / guardian.",
  },
  Character: {
    title: "Character Certificate",
    purpose: "issued to certify the student's conduct and character.",
  },
  Migration: {
    title: "Migration Certificate",
    purpose: "issued to permit migration to another institution or board.",
  },
};

/** Class + section as a single display line, e.g. "Class 6, Section A". */
export const classLine = (c: Pick<Certificate, "className" | "section">) =>
  c.section ? `${c.className}, Section ${c.section}` : c.className;

export const certificatesApi = createApiResource<Certificate, CertificateFilters, "code">(
  "/api/certificates"
);
