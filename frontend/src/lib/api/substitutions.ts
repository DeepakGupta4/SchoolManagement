import { createApiResource } from "./createApiResource";

export type SubstitutionStatus = "assigned" | "cancelled";

/** One covered period of an absent teacher, handed to a substitute. */
export interface Substitution {
  id: string;
  date: string;
  day: string;
  period: number;
  time: string;
  className: string;
  subject: string;
  room: string;
  absentTeacher: string;
  absentEmpId: string;
  substituteTeacher: string;
  substituteEmpId: string;
  substituteEmail: string;
  status: SubstitutionStatus;
  note: string;
}

export interface SubstitutionFilters {
  search?: string;
  date?: string;
  status?: SubstitutionStatus;
  substituteTeacher?: string;
  absentTeacher?: string;
  /** Page size; raised above the 200 default when a whole day is needed. */
  limit?: number;
}

export const substitutionsApi = createApiResource<Substitution, SubstitutionFilters>(
  "/api/substitutions"
);
