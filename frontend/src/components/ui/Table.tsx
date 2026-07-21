"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  /** Stable key; also used as the sort key when `sortable`. */
  key: string;
  header: string;
  /** Cell renderer. Omit to render `row[key]` as text. */
  render?: (row: T) => React.ReactNode;
  /** Value used for sorting/comparison. Defaults to `row[key]`. */
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  /** Extra classes per row — for selection tints, rank highlights, muted rows. */
  rowClassName?: (row: T) => string | undefined;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

type SortDir = "asc" | "desc";

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function Table<T>({
  columns,
  rows,
  rowKey,
  loading,
  onRowClick,
  rowClassName,
  emptyTitle = "No records found",
  emptyDescription,
  emptyAction,
  className,
}: TableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return rows;

    const valueOf = (row: T) =>
      column.sortValue
        ? column.sortValue(row)
        : ((row as Record<string, unknown>)[column.key] as string | number);

    // Slice first — Array.sort mutates, and `rows` is owned by the caller.
    return [...rows].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null // third click clears sorting
        : { key, dir: "asc" }
    );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface-raised",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-sunken">
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                const SortIcon = !isSorted ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      isSorted ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted",
                      alignClass[col.align ?? "left"],
                      col.className
                    )}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "focus-ring inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-text",
                          isSorted && "text-text"
                        )}
                      >
                        {col.header}
                        <SortIcon className="size-3" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {!loading && sortedRows.length > 0 && (
            <tbody>
              {sortedRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-surface-hover",
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3.5 text-text",
                        alignClass[col.align ?? "left"],
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {loading && <TableSkeleton columns={columns.length} />}

      {!loading && sortedRows.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      )}
    </div>
  );
}
