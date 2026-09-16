import { createApiResource } from "./createApiResource";

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  total: number;
  available: number;
  isbn: string;
  publisher: string;
  year: number;
}

export interface BookFilters {
  search?: string;
  /** "All" means no category filter. */
  category?: string;
  /** Catalog tab: "All Books" | "Available" | "Issued Out". */
  availability?: string;
}

export const CATEGORY_OPTIONS = [
  "Textbook",
  "Biography",
  "Fiction",
  "Finance",
  "History",
  "Reference",
  "Self-Help",
];

export const booksApi = createApiResource<Book, BookFilters>("/api/books");
