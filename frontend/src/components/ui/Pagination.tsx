"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number; // 1-indexed
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

/** Page numbers with ellipses, always showing first, last and the neighbours of current. */
function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const visible = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  visible.forEach((p, i) => {
    if (i > 0 && p - visible[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const navButton =
    "focus-ring inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-text disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="text-xs text-muted">
        Showing <span className="font-medium text-text">{from}</span>–
        <span className="font-medium text-text">{to}</span> of{" "}
        <span className="font-medium text-text">{totalItems}</span>
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={navButton}
        >
          <ChevronLeft className="size-4" />
        </button>

        {pageNumbers(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-subtle">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "focus-ring inline-flex size-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
                p === page
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-surface-hover hover:text-text"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={navButton}
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}
