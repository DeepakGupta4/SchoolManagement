"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  BookOpen,
  BookCheck,
  BookMarked,
  AlertCircle,
  RotateCcw,
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
import { useAsyncList } from "@/hooks/useAsyncList";
import { booksApi, CATEGORY_OPTIONS, type Book } from "@/lib/api/books";
import {
  listBookIssues,
  issueBook,
  returnBook,
  type BookIssue,
  type IssueBookInput,
} from "@/lib/api/bookIssues";
import type { BookSchema } from "@/lib/schemas/book";
import { DetailModal } from "@/components/DetailModal";
import { BookFormModal } from "./BookFormModal";
import { IssueFormModal } from "./IssueFormModal";

/** Local date as YYYY-MM-DD — the register compares due dates against "today". */
const todayISO = () => new Date().toLocaleDateString("en-CA");

/** Friendly en-IN date, e.g. "21 Oct 2026"; em dash for an unset date. */
const fmtDate = (iso: string) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/** Whole days `todayIso` is past `dueIso` (never negative). Mirrors the ₹2/day fine. */
const overdueDaysBetween = (dueIso: string, todayIso: string) =>
  Math.max(0, Math.round((Date.parse(todayIso) - Date.parse(dueIso)) / 86_400_000));

/** Fine levied per overdue day, in rupees — matches the backend. */
const FINE_PER_DAY = 2;

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
  const [viewing, setViewing] = useState<Book | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Book | null>(null);
  const { toast } = useToast();

  // Circulation records (newest first), independent of the catalogue filters.
  const fetchIssues = useCallback(() => listBookIssues().then((r) => r.data), []);
  const {
    items: issues,
    loading: issuesLoading,
    error: issuesError,
    refetch: refetchIssues,
  } = useAsyncList<BookIssue>(fetchIssues);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [pendingReturn, setPendingReturn] = useState<BookIssue | null>(null);
  const [returning, setReturning] = useState(false);

  const today = todayISO();
  const isOverdue = (i: BookIssue) => i.status === "issued" && i.dueDate < today;

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
      // Still-out copies whose due date has already passed.
      overdue: issues.filter((i) => i.status === "issued" && i.dueDate < today).length,
    }),
    [items, issues, today]
  );

  /** Exports the catalogue or the issue register, whichever section is open. */
  const handleExport = () => {
    const onCatalog = activeSection === "catalog";
    const count = onCatalog ? visibleBooks.length : issues.length;
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
      exportToCsv<BookIssue>(
        "library-issues",
        [
          { header: "Issue ID", value: (i) => i.code },
          { header: "Book", value: (i) => i.bookTitle },
          { header: "Borrower", value: (i) => i.borrowerName },
          { header: "Borrower Type", value: (i) => i.borrowerType },
          { header: "Issue Date", value: (i) => i.issueDate },
          { header: "Due Date", value: (i) => i.dueDate },
          { header: "Return Date", value: (i) => i.returnDate || "—" },
          { header: "Status", value: (i) => (isOverdue(i) ? "overdue" : i.status) },
          { header: "Fine", value: (i) => i.fine },
        ],
        issues
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

  const handleIssueSubmit = async (values: IssueBookInput) => {
    setIssuing(true);
    try {
      const created = await issueBook(values);
      toast({
        title: "Book issued",
        description: `${created.bookTitle} issued to ${created.borrowerName}.`,
      });
      setIssueOpen(false);
      refetchIssues();
      refetch(); // the catalogue's available count has dropped by one
    } catch (e) {
      toast({
        title: "Could not issue book",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setIssuing(false);
    }
  };

  const handleReturn = async () => {
    if (!pendingReturn) return;
    setReturning(true);
    try {
      const res = await returnBook(pendingReturn.id);
      toast({
        title: "Book returned",
        description:
          res.fine > 0
            ? `${pendingReturn.bookTitle} returned. Fine due: ₹${res.fine.toLocaleString("en-IN")}.`
            : `${pendingReturn.bookTitle} returned.`,
      });
      setPendingReturn(null);
      refetchIssues();
      refetch(); // the copy is back on the shelf
    } catch (e) {
      toast({
        title: "Could not return book",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setReturning(false);
    }
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
            onClick={() => setViewing(b)}
            aria-label={`View ${b.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
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

  const issueColumns: Column<BookIssue>[] = [
    {
      key: "bookTitle",
      header: "Book",
      sortable: true,
      render: (i) => (
        <div className="min-w-0 max-w-56">
          <p className="truncate font-medium text-text">{i.bookTitle}</p>
          <p className="truncate font-mono text-xs text-subtle">{i.code}</p>
        </div>
      ),
    },
    {
      key: "borrowerName",
      header: "Borrower",
      sortable: true,
      render: (i) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{i.borrowerName}</p>
          <p className="truncate text-xs capitalize text-subtle">
            {i.borrowerType}
            {i.borrowerId ? ` · ${i.borrowerId}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "issueDate",
      header: "Issued",
      sortable: true,
      render: (i) => <span className="whitespace-nowrap text-muted">{fmtDate(i.issueDate)}</span>,
    },
    {
      key: "dueDate",
      header: "Due",
      sortable: true,
      render: (i) => <span className="whitespace-nowrap text-muted">{fmtDate(i.dueDate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (i) => (isOverdue(i) ? "overdue" : i.status),
      render: (i) => {
        if (i.status === "returned") return <Badge variant="success">Returned</Badge>;
        if (isOverdue(i)) return <Badge variant="danger">Overdue</Badge>;
        return <Badge variant="info">Issued</Badge>;
      },
    },
    {
      key: "fine",
      header: "Fine",
      align: "right",
      sortable: true,
      render: (i) =>
        i.fine > 0 ? (
          <span className="font-semibold text-danger">₹{i.fine.toLocaleString("en-IN")}</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (i) =>
        i.status === "issued" ? (
          <Button variant="outline" size="sm" onClick={() => setPendingReturn(i)}>
            <RotateCcw className="size-3.5" />
            Return
          </Button>
        ) : (
          <span className="whitespace-nowrap text-xs text-subtle">
            Returned {fmtDate(i.returnDate)}
          </span>
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
            <p className="text-xs text-muted">
              {issues.length} issue record{issues.length === 1 ? "" : "s"}
              {stats.overdue > 0 ? ` · ${stats.overdue} overdue` : ""}
            </p>
            <Button className="ml-auto" onClick={() => setIssueOpen(true)}>
              <Plus className="size-4" />
              Issue book
            </Button>
          </div>

          {issuesError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm font-medium text-danger">{issuesError}</p>
                <Button variant="outline" onClick={refetchIssues}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Table
              columns={issueColumns}
              rows={issues}
              rowKey={(i) => i.id}
              loading={issuesLoading}
              pageSize={15}
              emptyTitle="No issued books yet"
              emptyDescription="Issue a book to a student, teacher or staff member to start the register."
              emptyAction={
                <Button variant="outline" onClick={() => setIssueOpen(true)}>
                  <Plus className="size-4" />
                  Issue book
                </Button>
              }
            />
          )}
        </>
      )}

      <BookFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        existing={items}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.title ?? "Book"}
        description={viewing ? `${viewing.author} · ${viewing.category}` : ""}
        rows={
          viewing
            ? [
                { label: "Title", value: viewing.title },
                { label: "Author", value: viewing.author },
                { label: "Category", value: viewing.category },
                { label: "ISBN", value: viewing.isbn },
                { label: "Publisher", value: viewing.publisher },
                { label: "Year", value: viewing.year },
                { label: "Total copies", value: viewing.total },
                { label: "Available", value: viewing.available },
                { label: "Issued out", value: viewing.total - viewing.available },
              ]
            : []
        }
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

      <IssueFormModal
        open={issueOpen}
        onOpenChange={setIssueOpen}
        saving={issuing}
        onSubmit={handleIssueSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingReturn)}
        onOpenChange={(open) => !open && setPendingReturn(null)}
        title="Return this book?"
        description={
          pendingReturn
            ? isOverdue(pendingReturn)
              ? `"${pendingReturn.bookTitle}" is ${overdueDaysBetween(pendingReturn.dueDate, today)} day(s) overdue — a fine of ₹${(
                  overdueDaysBetween(pendingReturn.dueDate, today) * FINE_PER_DAY
                ).toLocaleString("en-IN")} will apply. Mark it returned?`
              : `Mark "${pendingReturn.bookTitle}" (issued to ${pendingReturn.borrowerName}) as returned.`
            : ""
        }
        confirmLabel="Mark returned"
        loading={returning}
        onConfirm={handleReturn}
      />
    </div>
  );
}
