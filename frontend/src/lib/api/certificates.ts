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
}

export interface CertificateFilters {
  search?: string;
  type?: string;
  status?: string;
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

/** "2026-07-21" — the ISO form every certificate date is stored in. */
export const todayIso = () => new Date().toISOString().slice(0, 10);

/** "VC-8KD2-91XM" — printed under the QR code on the issued certificate. */
export const makeVerificationCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  const block = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `VC-${block(4)}-${block(4)}`;
};

export const certificatesApi = createApiResource<Certificate, CertificateFilters, "code">(
  "/api/certificates"
);
