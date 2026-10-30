import { api } from "./client";

/** A single leave request for the signed-in teacher. */
export interface LeaveRow {
  id: string;
  code: string;
  name: string;
  role: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  dept: string;
  email: string;
}

/** The teacher's own leave requests (scoped server-side to their account). */
export const listMyLeave = () => api<LeaveRow[]>("/api/leave-requests/mine");

/** File a new request. The server validates the real dates and computes `days`. */
export const applyLeave = (body: { type: string; from: string; to: string; reason: string }) =>
  api<LeaveRow>("/api/leave-requests/mine", { method: "POST", body });
