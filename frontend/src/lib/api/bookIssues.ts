import { apiList, apiRequest } from "./client";

export type BorrowerType = "student" | "staff" | "teacher";
export type IssueStatus = "issued" | "returned";

/** Mirrors the backend BookIssue model (with `id` in place of `_id`). */
export interface BookIssue {
  id: string;
  code: string;
  bookId: string;
  bookTitle: string;
  borrowerType: BorrowerType;
  borrowerName: string;
  borrowerId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string;
  status: IssueStatus;
  fine: number;
}

export interface BookIssueFilters {
  search?: string;
  /** "All" (or omitted) means no status filter. */
  status?: string;
  borrowerType?: string;
}

/** Fields the client supplies when issuing a book — the rest are server-owned. */
export interface IssueBookInput {
  bookId: string;
  bookTitle: string;
  borrowerType: BorrowerType;
  borrowerName: string;
  borrowerId?: string;
  issueDate: string;
  dueDate: string;
}

/** The slim record the return endpoint echoes back. */
export interface ReturnResult {
  id: string;
  status: IssueStatus;
  returnDate: string;
  fine: number;
}

/** Lists circulation records (newest first), keeping the pagination `meta`. */
export function listBookIssues(filters?: BookIssueFilters) {
  const query: Record<string, string> = {};
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") query[key] = String(value);
    }
  }
  return apiList<BookIssue>("/api/book-issues", { query });
}

/** Issues a copy of a book to a borrower. */
export function issueBook(values: IssueBookInput) {
  return apiRequest<BookIssue>("/api/book-issues", { method: "POST", body: values });
}

/** Marks an issued record returned; the server computes any overdue fine. */
export function returnBook(id: string) {
  return apiRequest<ReturnResult>(`/api/book-issues/${id}/return`, { method: "POST" });
}
