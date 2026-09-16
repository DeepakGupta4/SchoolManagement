import { createApiResource } from "./createApiResource";

export type VisitorPurpose =
  | "Parent meeting"
  | "Admission enquiry"
  | "Vendor / delivery"
  | "Maintenance"
  | "Student pickup"
  | "Official inspection";

export type VisitorStatus = "inside" | "checked-out" | "expected";

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: VisitorPurpose;
  whomToMeet: string;
  inTime: string;
  outTime: string | null;
  passCode: string;
  status: VisitorStatus;
  /** Set when the visitor is authorised to collect a student at the gate. */
  pickupFor: string | null;
}

export interface VisitorFilters {
  search?: string;
  purpose?: string;
  status?: string;
}

export const VISITOR_PURPOSE_OPTIONS: { label: string; value: VisitorPurpose }[] = [
  { label: "Parent meeting", value: "Parent meeting" },
  { label: "Admission enquiry", value: "Admission enquiry" },
  { label: "Vendor / delivery", value: "Vendor / delivery" },
  { label: "Maintenance", value: "Maintenance" },
  { label: "Student pickup", value: "Student pickup" },
  { label: "Official inspection", value: "Official inspection" },
];

export const VISITOR_STATUS_OPTIONS: { label: string; value: VisitorStatus }[] = [
  { label: "Inside", value: "inside" },
  { label: "Checked out", value: "checked-out" },
  { label: "Expected", value: "expected" },
];

/** "09:12" — 24-hour gate-log format. */
export const currentTime = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Gate passes avoid I/O/1/0 so guards can read them off a printed slip. */
export const makePassCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `GP-${code}`;
};

export const visitorsApi = createApiResource<Visitor, VisitorFilters>("/api/visitors");
