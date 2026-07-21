import { createResource, textMatch } from "./createResource";

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

const seed: Book[] = [
  { id: "bk_001", title: "Mathematics NCERT Class 10",    author: "NCERT",              category: "Textbook",  total: 45, available: 12, isbn: "978-81-7450-001-1", publisher: "NCERT",        year: 2023 },
  { id: "bk_002", title: "Physics Part I Class 11",       author: "NCERT",              category: "Textbook",  total: 40, available: 8,  isbn: "978-81-7450-002-2", publisher: "NCERT",        year: 2023 },
  { id: "bk_003", title: "Wings of Fire",                 author: "A.P.J. Abdul Kalam", category: "Biography", total: 10, available: 3,  isbn: "978-81-7371-146-6", publisher: "Universities Press", year: 2020 },
  { id: "bk_004", title: "The Alchemist",                 author: "Paulo Coelho",       category: "Fiction",   total: 8,  available: 5,  isbn: "978-0-06-231500-7", publisher: "HarperCollins", year: 2019 },
  { id: "bk_005", title: "Chemistry NCERT Class 12",      author: "NCERT",              category: "Textbook",  total: 38, available: 15, isbn: "978-81-7450-003-3", publisher: "NCERT",        year: 2023 },
  { id: "bk_006", title: "Rich Dad Poor Dad",             author: "Robert Kiyosaki",    category: "Finance",   total: 6,  available: 2,  isbn: "978-1-61268-116-2", publisher: "Plata Publishing", year: 2017 },
  { id: "bk_007", title: "History of Modern India",       author: "Bipan Chandra",      category: "History",   total: 15, available: 9,  isbn: "978-81-250-3684-5", publisher: "Orient Blackswan", year: 2021 },
  { id: "bk_008", title: "English Grammar in Use",        author: "Raymond Murphy",     category: "Reference", total: 20, available: 0,  isbn: "978-1-107-53933-6", publisher: "Cambridge",    year: 2019 },
  { id: "bk_009", title: "Computer Science Class 12",     author: "Sumita Arora",       category: "Textbook",  total: 30, available: 18, isbn: "978-93-5134-234-5", publisher: "Dhanpat Rai",  year: 2023 },
  { id: "bk_010", title: "Atomic Habits",                 author: "James Clear",        category: "Self-Help", total: 5,  available: 1,  isbn: "978-0-7352-1129-2", publisher: "Avery",        year: 2018 },
];

export const booksApi = createResource<Book, BookFilters>({
  idPrefix: "bk",
  seed,
  uniqueBy: { field: "isbn", label: "ISBN" },
  defaults: { total: 0, available: 0 },
  matches: (row, { search, category, availability }) => {
    if (category && category !== "All" && row.category !== category) return false;
    if (availability === "Available" && row.available === 0) return false;
    if (availability === "Issued Out" && row.available !== 0) return false;
    return textMatch(search, row.title, row.author, row.isbn);
  },
});
