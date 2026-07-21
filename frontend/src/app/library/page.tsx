"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  Eye,
  BookOpen,
  BookCheck,
  BookMarked,
  CheckCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const books = [
  { id: "BK001", title: "Mathematics NCERT Class 10",    author: "NCERT",              category: "Textbook",  total: 45, available: 12, isbn: "978-81-7450-001-1", publisher: "NCERT",        year: 2023 },
  { id: "BK002", title: "Physics Part I Class 11",       author: "NCERT",              category: "Textbook",  total: 40, available: 8,  isbn: "978-81-7450-002-2", publisher: "NCERT",        year: 2023 },
  { id: "BK003", title: "Wings of Fire",                 author: "A.P.J. Abdul Kalam", category: "Biography", total: 10, available: 3,  isbn: "978-81-7371-146-6", publisher: "Universities Press", year: 2020 },
  { id: "BK004", title: "The Alchemist",                 author: "Paulo Coelho",       category: "Fiction",   total: 8,  available: 5,  isbn: "978-0-06-231500-7", publisher: "HarperCollins", year: 2019 },
  { id: "BK005", title: "Chemistry NCERT Class 12",      author: "NCERT",              category: "Textbook",  total: 38, available: 15, isbn: "978-81-7450-003-3", publisher: "NCERT",        year: 2023 },
  { id: "BK006", title: "Rich Dad Poor Dad",             author: "Robert Kiyosaki",    category: "Finance",   total: 6,  available: 2,  isbn: "978-1-61268-116-2", publisher: "Plata Publishing", year: 2017 },
  { id: "BK007", title: "History of Modern India",       author: "Bipan Chandra",      category: "History",   total: 15, available: 9,  isbn: "978-81-250-3684-5", publisher: "Orient Blackswan", year: 2021 },
  { id: "BK008", title: "English Grammar in Use",        author: "Raymond Murphy",     category: "Reference", total: 20, available: 0,  isbn: "978-1-107-53933-6", publisher: "Cambridge",    year: 2019 },
  { id: "BK009", title: "Computer Science Class 12",     author: "Sumita Arora",       category: "Textbook",  total: 30, available: 18, isbn: "978-93-5134-234-5", publisher: "Dhanpat Rai",  year: 2023 },
  { id: "BK010", title: "Atomic Habits",                 author: "James Clear",        category: "Self-Help", total: 5,  available: 1,  isbn: "978-0-7352-1129-2", publisher: "Avery",        year: 2018 },
];

const issuedBooks = [
  { id: "ISS001", book: "Wings of Fire",            student: "Aarav Sharma",  class: "10-A", issueDate: "Jul 10, 2025", dueDate: "Jul 24, 2025", status: "issued"  },
  { id: "ISS002", book: "The Alchemist",            student: "Priya Patel",   class: "9-B",  issueDate: "Jul 08, 2025", dueDate: "Jul 22, 2025", status: "overdue" },
  { id: "ISS003", book: "Rich Dad Poor Dad",        student: "Rohan Verma",   class: "11-A", issueDate: "Jul 12, 2025", dueDate: "Jul 26, 2025", status: "issued"  },
  { id: "ISS004", book: "Atomic Habits",            student: "Sneha Gupta",   class: "10-B", issueDate: "Jul 05, 2025", dueDate: "Jul 19, 2025", status: "overdue" },
  { id: "ISS005", book: "English Grammar in Use",   student: "Karan Singh",   class: "8-A",  issueDate: "Jul 14, 2025", dueDate: "Jul 28, 2025", status: "issued"  },
  { id: "ISS006", book: "History of Modern India",  student: "Ananya Joshi",  class: "12-B", issueDate: "Jul 01, 2025", dueDate: "Jul 15, 2025", status: "returned"},
  { id: "ISS007", book: "Physics Part I Class 11",  student: "Vikram Nair",   class: "11-A", issueDate: "Jul 13, 2025", dueDate: "Jul 27, 2025", status: "issued"  },
  { id: "ISS008", book: "Mathematics NCERT Class 10",student: "Meera Iyer",   class: "10-A", issueDate: "Jun 28, 2025", dueDate: "Jul 12, 2025", status: "returned"},
];

type Book = (typeof books)[number];
type IssueRecord = (typeof issuedBooks)[number];

/** Category colour coding: a badge tone plus a tile gradient, both tokenised. */
const categoryStyles: Record<
  string,
  { variant: "default" | "success" | "warning" | "danger" | "info"; gradient: string }
> = {
  Textbook:    { variant: "info",    gradient: "gradient-indigo" },
  Biography:   { variant: "success", gradient: "gradient-emerald" },
  Fiction:     { variant: "default", gradient: "gradient-violet" },
  Finance:     { variant: "warning", gradient: "gradient-amber" },
  History:     { variant: "danger",  gradient: "gradient-rose" },
  Reference:   { variant: "info",    gradient: "gradient-cyan" },
  "Self-Help": { variant: "default", gradient: "gradient-violet" },
};

const statusConfig: Record<
  string,
  { variant: "info" | "danger" | "success"; icon: LucideIcon; label: string }
> = {
  issued:   { variant: "info",    icon: Clock,       label: "Issued"   },
  overdue:  { variant: "danger",  icon: AlertCircle, label: "Overdue"  },
  returned: { variant: "success", icon: CheckCircle, label: "Returned" },
};

const tabs = ["All", "Issued", "Overdue", "Returned"];
const catalogTabs = ["All Books", "Available", "Issued Out"];

function Segmented({
  options,
  value,
  onChange,
  size = "sm",
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "focus-ring whitespace-nowrap rounded-sm font-semibold transition-colors",
            size === "md" ? "px-5 py-2 text-sm" : "px-3.5 py-1.5 text-xs",
            value === o ? "bg-surface-raised text-text shadow-sm" : "text-muted hover:text-text"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function RowActions({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" className="px-2" aria-label={`View ${label}`}>
        <Eye className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" className="px-2" aria-label={`Edit ${label}`}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="px-2 hover:bg-danger-soft hover:text-danger"
        aria-label={`Delete ${label}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export default function LibraryPage() {
  const [activeSection, setActiveSection] = useState<"catalog" | "issued">("catalog");
  const [catalogTab, setCatalogTab] = useState("All Books");
  const [issueTab, setIssueTab] = useState("All");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const filteredBooks = books.filter((b) => {
    const matchCat = catFilter === "All" || b.category === catFilter;
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      catalogTab === "All Books" ||
      (catalogTab === "Available" ? b.available > 0 : b.available === 0);
    return matchCat && matchSearch && matchTab;
  });

  const filteredIssued = issuedBooks.filter((i) => {
    const matchTab = issueTab === "All" || i.status === issueTab.toLowerCase();
    const matchSearch =
      i.book.toLowerCase().includes(search.toLowerCase()) ||
      i.student.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalBooks = books.reduce((s, b) => s + b.total, 0);
  const totalIssued = books.reduce((s, b) => s + (b.total - b.available), 0);
  const overdueCount = issuedBooks.filter((i) => i.status === "overdue").length;

  const bookColumns: Column<Book>[] = [
    {
      key: "title",
      header: "Book",
      sortable: true,
      render: (b) => {
        const cc = categoryStyles[b.category];
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md text-white",
                cc?.gradient ?? "gradient-indigo"
              )}
            >
              <BookOpen className="size-4" />
            </div>
            <div className="min-w-0 max-w-52">
              <p className="truncate font-medium text-text">{b.title}</p>
              <p className="truncate text-xs text-subtle">{b.id}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "author",
      header: "Author",
      sortable: true,
      render: (b) => <span className="whitespace-nowrap text-muted">{b.author}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (b) => (
        <Badge variant={categoryStyles[b.category]?.variant ?? "default"}>{b.category}</Badge>
      ),
    },
    {
      key: "isbn",
      header: "ISBN",
      render: (b) => <span className="whitespace-nowrap font-mono text-xs text-subtle">{b.isbn}</span>,
    },
    {
      key: "publisher",
      header: "Publisher",
      render: (b) => <span className="whitespace-nowrap text-muted">{b.publisher}</span>,
    },
    {
      key: "year",
      header: "Year",
      sortable: true,
      align: "right",
      render: (b) => <span className="text-muted">{b.year}</span>,
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      align: "right",
      render: (b) => <span className="font-semibold text-text">{b.total}</span>,
    },
    {
      key: "available",
      header: "Available",
      sortable: true,
      render: (b) => (
        <Badge variant={b.available === 0 ? "danger" : b.available <= 3 ? "warning" : "success"}>
          {b.available === 0 ? "Out of stock" : b.available}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (b) => <RowActions label={b.title} />,
    },
  ];

  const issueColumns: Column<IssueRecord>[] = [
    {
      key: "id",
      header: "Issue ID",
      sortable: true,
      render: (r) => <span className="text-xs font-semibold text-primary-text">{r.id}</span>,
    },
    {
      key: "book",
      header: "Book",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
            <BookOpen className="size-3.5" />
          </div>
          <p className="min-w-0 max-w-44 truncate font-medium text-text">{r.book}</p>
        </div>
      ),
    },
    {
      key: "student",
      header: "Student",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap font-medium text-text">{r.student}</span>,
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (r) => <Badge variant="info">{r.class}</Badge>,
    },
    {
      key: "issueDate",
      header: "Issue date",
      render: (r) => <span className="whitespace-nowrap text-muted">{r.issueDate}</span>,
    },
    {
      key: "dueDate",
      header: "Due date",
      render: (r) => (
        <span
          className={cn(
            "whitespace-nowrap font-medium",
            r.status === "overdue" ? "text-danger" : "text-muted"
          )}
        >
          {r.dueDate}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => {
        const sc = statusConfig[r.status];
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1">
            <StatusIcon className="size-3" />
            {sc.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" title="Return book" aria-label={`Return ${r.book}`}>
            <RotateCcw className="size-3.5" />
            Return
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Library"
        description="Manage books, issue records and members."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add book
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total books" value={totalBooks} icon={BookOpen} tone="indigo" />
        <StatCard
          label="Available"
          value={books.reduce((s, b) => s + b.available, 0)}
          icon={BookCheck}
          tone="emerald"
        />
        <StatCard label="Issued out" value={totalIssued} icon={BookMarked} tone="amber" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertCircle} tone="rose" />
      </div>

      <Segmented
        options={["Book Catalog", "Issue Records"]}
        value={activeSection === "catalog" ? "Book Catalog" : "Issue Records"}
        onChange={(v) => {
          setActiveSection(v === "Book Catalog" ? "catalog" : "issued");
          setSearch("");
        }}
        size="md"
      />

      {activeSection === "catalog" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented options={catalogTabs} value={catalogTab} onChange={setCatalogTab} />
            <div className="w-48">
              <Select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                aria-label="Filter by category"
                options={[
                  { label: "All categories", value: "All" },
                  ...Object.keys(categoryStyles).map((c) => ({ label: c, value: c })),
                ]}
              />
            </div>
            <div className="min-w-60 flex-1">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author…"
                icon={<Search className="size-4" />}
                aria-label="Search books"
              />
            </div>
            <p className="text-xs text-muted">{filteredBooks.length} books</p>
          </div>

          <Table
            columns={bookColumns}
            rows={filteredBooks}
            rowKey={(b) => b.id}
            emptyTitle="No books found"
            emptyDescription="Try adjusting your filters or search."
          />
        </>
      )}

      {activeSection === "issued" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented options={tabs} value={issueTab} onChange={setIssueTab} />
            <div className="min-w-60 flex-1">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by book or student…"
                icon={<Search className="size-4" />}
                aria-label="Search issue records"
              />
            </div>
            <p className="text-xs text-muted">{filteredIssued.length} records</p>
          </div>

          <Table
            columns={issueColumns}
            rows={filteredIssued}
            rowKey={(r) => r.id}
            emptyTitle="No issue records found"
            emptyDescription="Try a different tab or search term."
          />
        </>
      )}
    </div>
  );
}
