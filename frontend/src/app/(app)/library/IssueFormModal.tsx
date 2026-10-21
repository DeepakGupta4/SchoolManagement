"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, Modal, Select } from "@/components/ui";
import { booksApi, type Book } from "@/lib/api/books";
import type { BorrowerType, IssueBookInput } from "@/lib/api/bookIssues";

const BORROWER_OPTIONS: { label: string; value: BorrowerType }[] = [
  { label: "Student", value: "student" },
  { label: "Staff", value: "staff" },
  { label: "Teacher", value: "teacher" },
];

/** Local date as YYYY-MM-DD — matches how the register compares due dates. */
const toISO = (d: Date) => d.toLocaleDateString("en-CA");
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISO(d);
};

interface IssueFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving?: boolean;
  onSubmit: (values: IssueBookInput) => Promise<void> | void;
}

export function IssueFormModal({ open, onOpenChange, saving, onSubmit }: IssueFormModalProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState<string | null>(null);

  const [bookId, setBookId] = useState("");
  const [borrowerType, setBorrowerType] = useState<BorrowerType>("student");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerId, setBorrowerId] = useState("");
  const [issueDate, setIssueDate] = useState(() => toISO(new Date()));
  const [dueDate, setDueDate] = useState(() => addDays(toISO(new Date()), 14));
  const [formError, setFormError] = useState<string | null>(null);

  // Reload the catalogue fresh each open (availability may have moved) and reset
  // the form so a previous entry can't leak through.
  useEffect(() => {
    if (!open) return;
    const t = toISO(new Date());
    setBookId("");
    setBorrowerType("student");
    setBorrowerName("");
    setBorrowerId("");
    setIssueDate(t);
    setDueDate(addDays(t, 14));
    setFormError(null);

    let cancelled = false;
    setBooksLoading(true);
    setBooksError(null);
    booksApi
      .list({})
      .then((data) => {
        if (cancelled) return;
        setBooks(data);
        // Preselect the first in-stock title so the common case is one click.
        const first = data.find((b) => b.available > 0);
        if (first) setBookId(first.id);
      })
      .catch((e) => {
        if (!cancelled) setBooksError(e instanceof Error ? e.message : "Could not load books.");
      })
      .finally(() => {
        if (!cancelled) setBooksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedBook = useMemo(() => books.find((b) => b.id === bookId) ?? null, [books, bookId]);
  const outOfStock = Boolean(selectedBook && selectedBook.available <= 0);

  // Every title is listed; out-of-stock ones are labelled and blocked at submit
  // (a native <select> can't disable individual options).
  const bookOptions = useMemo(
    () =>
      books.map((b) => ({
        value: b.id,
        label: b.available > 0 ? `${b.title} · ${b.available} available` : `${b.title} · out of stock`,
      })),
    [books]
  );

  const submit = () => {
    if (!selectedBook) {
      setFormError("Pick a book to issue.");
      return;
    }
    if (selectedBook.available <= 0) {
      setFormError(`"${selectedBook.title}" is out of stock.`);
      return;
    }
    if (!borrowerName.trim()) {
      setFormError("Enter the borrower's name.");
      return;
    }
    if (!issueDate || !dueDate) {
      setFormError("Issue and due dates are both required.");
      return;
    }
    if (dueDate < issueDate) {
      setFormError("The due date can't be before the issue date.");
      return;
    }
    setFormError(null);
    void onSubmit({
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      borrowerType,
      borrowerName: borrowerName.trim(),
      borrowerId: borrowerId.trim(),
      issueDate,
      dueDate,
    });
  };

  const disabled = saving || booksLoading || outOfStock || !bookId;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Issue a book"
      description="Check a copy out to a borrower. Availability updates on issue."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={disabled}>
            {saving ? "Issuing…" : "Issue book"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4"
      >
        {booksError ? (
          <p className="text-sm text-danger">{booksError}</p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Select
                label="Book"
                required
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                placeholder={booksLoading ? "Loading catalogue…" : "Select a book…"}
                options={bookOptions}
                disabled={booksLoading}
              />
              {selectedBook && (
                <Badge variant={selectedBook.available > 0 ? "success" : "danger"}>
                  {selectedBook.available > 0
                    ? `${selectedBook.available} available`
                    : "Out of stock"}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Borrower type"
                required
                value={borrowerType}
                onChange={(e) => setBorrowerType(e.target.value as BorrowerType)}
                options={BORROWER_OPTIONS}
              />
              <Input
                label="Borrower name"
                required
                placeholder="e.g. Aarav Sharma"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
              />
              <Input
                label="Borrower ID"
                placeholder="Roll no. / employee ID (optional)"
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
              />
              <div className="hidden sm:block" aria-hidden />
              <Input
                label="Issue date"
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
              <Input
                label="Due date"
                type="date"
                required
                value={dueDate}
                min={issueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {formError && <p className="text-xs text-danger">{formError}</p>}
          </>
        )}

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
