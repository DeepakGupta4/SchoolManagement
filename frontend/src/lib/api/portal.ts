import { apiRequest } from "./client";

/** A child shown in the parent portal — only the child's own summary, no school-wide data. */
export interface PortalChild {
  id: string;
  name: string;
  className: string;
  section: string;
  rollNo: string;
  admissionNo: string;
  avatar: string;
  status: string;
  attendancePercent: number;
  performancePercent: number;
  feeDue: number;
}

/** The signed-in parent's own children (matched by their login email). */
export async function getMyChildren(): Promise<PortalChild[]> {
  return apiRequest<PortalChild[]>("/api/portal/children");
}
