import { createApiResource } from "./createApiResource";

export interface PayrollRecord {
  id: string;
  /** Human-facing employee code, e.g. "EMP001". */
  employeeId: string;
  name: string;
  role: string;
  dept: string;
  basic: number;
  hra: number;
  ta: number;
  deductions: number;
  net: number;
  status: string;
  bank: string;
}

export interface PayrollFilters {
  search?: string;
  role?: string;
  status?: string;
}

export const payrollApi = createApiResource<PayrollRecord, PayrollFilters>("/api/payroll");
