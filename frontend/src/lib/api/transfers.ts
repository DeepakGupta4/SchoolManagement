import { createApiResource } from "./createApiResource";

export interface TransferRequest {
  id: string;
  tcNo: string;
  name: string;
  studentId: string;
  className: string;
  type: string;
  reason: string;
  requestedOn: string;
  issuedOn: string;
  status: string;
  dues: number;
}

export interface TransferFilters {
  search?: string;
  status?: string;
  type?: string;
}

export const STATUS_META: Record<
  string,
  { label: string; variant: "warning" | "info" | "success" | "danger" }
> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "info" },
  issued: { label: "TC Issued", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, m]) => ({
  label: m.label,
  value,
}));

export const TYPE_OPTIONS = [
  { label: "Transfer", value: "transfer" },
  { label: "Withdrawal", value: "withdrawal" },
];

export const CLASS_OPTIONS = [
  "2-B", "3-A", "4-A", "5-B", "6-A", "6-B", "7-A", "8-A", "8-C",
  "9-A", "9-B", "10-A", "10-B", "11-A", "11-B", "12-A",
];

export const transfersApi = createApiResource<TransferRequest, TransferFilters>("/api/transfers");
