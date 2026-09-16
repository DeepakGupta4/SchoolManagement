import { createApiResource } from "./createApiResource";

export type LabType = "Physics" | "Chemistry" | "Biology" | "Computer";
export type LabStatus = "operational" | "maintenance" | "closed";

export interface Lab {
  id: string;
  name: string;
  type: LabType;
  block: string;
  capacity: number;
  inCharge: string;
  assistant: string;
  equipmentTotal: number;
  equipmentWorking: number;
  weeklyPracticals: number;
  nextPractical: string;
  nextPracticalClass: string;
  status: LabStatus;
}

export interface LabFilters {
  search?: string;
  type?: string;
  status?: string;
}

export const LAB_TYPE_OPTIONS: { label: string; value: LabType }[] = [
  { label: "Physics", value: "Physics" },
  { label: "Chemistry", value: "Chemistry" },
  { label: "Biology", value: "Biology" },
  { label: "Computer", value: "Computer" },
];

export const LAB_STATUS_OPTIONS: { label: string; value: LabStatus }[] = [
  { label: "Operational", value: "operational" },
  { label: "Under maintenance", value: "maintenance" },
  { label: "Closed", value: "closed" },
];

export const labsApi = createApiResource<Lab, LabFilters>("/api/labs");
