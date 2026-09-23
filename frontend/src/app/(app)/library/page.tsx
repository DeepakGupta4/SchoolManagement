"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
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
import { DetailModal } from "@/components/DetailModal";
import { BookFormModal } from "./BookFormModal";

type IssueRecord = {
  id: string;
  book: string;
  student: string;
  class: string;
  issueDate: string;
  dueDate: string;
  status: "issued" | "overdue" | "returned";
};

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
      // Issue records have no backend yet, so overdue cannot be derived.
      overdue: 0,
    }),
    [items]
  );

  // Circulation has no backend yet — the issued list renders an empty state.
  const filteredIssued: IssueRecord[] = [];

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
        <Card>
          <EmptyState
            icon={<BookMarked className="size-5" />}
            title="No issued books yet"
            description="Books checked out to students will appear here."
          />
        </Card>
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
    </div>
  );
}
