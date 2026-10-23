import { apiRequest } from "./client";

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  targetSchoolId: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

export async function listAuditLogs(params: {
  search?: string;
  action?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: AuditEntry[]; meta: { total: number; page: number; pages: number } }> {
  const query: Record<string, string | number | undefined> = {
    search: params.search,
    action: params.action,
    page: params.page,
    limit: params.limit,
  };
  const url = new URL("/api/audit", "http://x");
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  return apiRequest(`/api/audit?${url.searchParams.toString()}`);
}
