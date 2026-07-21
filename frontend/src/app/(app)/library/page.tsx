"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
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
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import { booksApi, CATEGORY_OPTIONS, type Book } from "@/lib/api/books";
import type { BookSchema } from "@/lib/schemas/book";
import { BookFormModal } from "./BookFormModal";

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

export default function LibraryPage() {
  const [activeSection, setActiveSection] = useState<"catalog" | "issued">("catalog");
  const [catalogTab, setCatalogTab] = useState("All Books");
  const [issueTab, setIssueTab] = useState("All");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  // The availability tab is deliberately left out of the server filters: the
  // stat cards need copy totals across the whole (otherwise filtered) catalogue
  // — an "Available" tab would drop every fully-issued title from the
  // "Issued out" sum — so the tab narrowing is applied during render instead.
  const filters = useMemo(() => ({ search, category: catFilter }), [search, catFilter]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    booksApi,
    filters,
    { label: "book", describe: (b) => b.title }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Book | null>(null);
  const { toast } = useToast();

  // Rows for the catalogue table only — stat cards keep counting all `items`.
  const visibleBooks = useMemo(() => {
    if (catalogTab === "Available") return items.filter((b) => b.available > 0);
    if (catalogTab === "Issued Out") return items.filter((b) => b.available === 0);
    return items;
  }, [items, catalogTab]);

  const stats = useMemo(
    () => ({
      total: items.reduce((s, b) => s + b.total, 0),
      available: items.reduce((s, b) => s + b.available, 0),
      issued: items.reduce((s, b) => s + (b.total - b.available), 0),
      // Issue records are a static fixture, not a resource, so this figure
      // cannot be derived from live data — it stays as-is until issuing is
      // backed by its own API.
      overdue: issuedBooks.filter((i) => i.status === "overdue").length,
    }),
    [items]
  );

  const filteredIssued = issuedBooks.filter((i) => {
    const matchTab = issueTab === "All" || i.status === issueTab.toLowerCase();
    const matchSearch =
      i.book.toLowerCase().includes(search.toLowerCase()) ||
      i.student.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  /** Exports the catalogue or the issue register, whichever section is open. */
  const handleExport = () => {
    const onCatalog = activeSection === "catalog";
    const count = onCatalog ? visibleBooks.length : filteredIssued.length;
    if (count === 0) {
      toast({
        title: "Nothing to export",
        description: `No ${onCatalog ? "books" : "issue records"} match the current filters.`,
        variant: "warning",
      });
      return;
    }
    if (onCatalog) {
      exportToCsv<Book>(
        "library-catalogue",
        [
          { header: "Title", value: (b) => b.title },
          { header: "Author", value: (b) => b.author },
          { header: "Category", value: (b) => b.category },
          { header: "ISBN", value: (b) => b.isbn },
          { header: "Publisher", value: (b) => b.publisher },
          { header: "Year", value: (b) => b.year },
          { header: "Total Copies", value: (b) => b.total },
          { header: "Available", value: (b) => b.available },
          { header: "Issued Out", value: (b) => b.total - b.available },
        ],
        visibleBooks
      );
    } else {
      exportToCsv<IssueRecord>(
        "library-issues",
        [
          { header: "Issue ID", value: (i) => i.id },
          { header: "Book", value: (i) => i.book },
          { header: "Student", value: (i) => i.student },
          { header: "Class", value: (i) => i.class },
          { header: "Issue Date", value: (i) => i.issueDate },
          { header: "Due Date", value: (i) => i.dueDate },
          { header: "Status", value: (i) => i.status },
        ],
        filteredIssued
      );
    }
    toast({
      title: "Export ready",
      description: `${count} ${onCatalog ? "book" : "issue record"}${count === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: BookSchema) => {
    const ok = await save(values, editing);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
  };

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
              <p className="truncate text-xs text-subtle">{b.publisher}</p>
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
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(b);
              setFormOpen(true);
            }}
            aria-label={`Edit ${b.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(b)}
            aria-label={`Delete ${b.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
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
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add book
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total books" value={stats.total} icon={BookOpen} tone="indigo" />
        <StatCard label="Available" value={stats.available} icon={BookCheck} tone="emerald" />
        <StatCard label="Issued out" value={stats.issued} icon={BookMarked} tone="amber" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertCircle} tone="rose" />
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
                  ...CATEGORY_OPTIONS.map((c) => ({ label: c, value: c })),
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
            <p className="text-xs text-muted">{visibleBooks.length} books</p>
          </div>

          {error ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm font-medium text-danger">{error}</p>
                <Button variant="outline" onClick={refetch}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Table
              columns={bookColumns}
              rows={visibleBooks}
              rowKey={(b) => b.id}
              loading={loading}
              emptyTitle="No books found"
              emptyDescription={
                search || catFilter !== "All" || catalogTab !== "All Books"
                  ? "Try adjusting your filters or search."
                  : "Add your first book to get started."
              }
              emptyAction={
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="size-4" />
                  Add book
                </Button>
              }
            />
          )}
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

      <BookFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete book?"
        description={
          pendingDelete
            ? `${pendingDelete.title} and its ${pendingDelete.total} copy record(s) will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
