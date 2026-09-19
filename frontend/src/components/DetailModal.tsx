"use client";

import type { ReactNode } from "react";
import { Modal, Button } from "@/components/ui";

export interface DetailRow {
  label: string;
  value: ReactNode;
  /** Span both columns (for long text like addresses or notes). */
  full?: boolean;
}

/**
 * A generic read-only "View" dialog. Pass a title and a list of label/value
 * rows and it renders them as a clean definition grid — used to give every
 * list row a View action without building a full detail page per module.
 */
export function DetailModal({
  open,
  onOpenChange,
  title,
  description,
  rows,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  rows: DetailRow[];
  /** Optional extra actions (e.g. an Edit button); a Close button is always shown. */
  footer?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="lg"
      footer={
        <>
          {footer}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </>
      }
    >
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div key={i} className={r.full ? "sm:col-span-2" : undefined}>
            <dt className="text-xs font-medium uppercase tracking-wide text-subtle">{r.label}</dt>
            <dd className="mt-1 break-words text-sm text-text">{r.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
