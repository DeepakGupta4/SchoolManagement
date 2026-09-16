import { createApiResource } from "./createApiResource";

export interface StudentDocument {
  id: string;
  /** Human-facing student code, e.g. "STU-0901". */
  studentId: string;
  name: string;
  className: string;
  guardian: string;
  birthCert: string;
  aadhaar: string;
  tc: string;
  marksheets: string;
  photo: string;
}

export interface StudentDocumentFilters {
  search?: string;
  className?: string;
}

export const studentDocumentsApi = createApiResource<StudentDocument, StudentDocumentFilters>(
  "/api/student-documents"
);
