"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  /** Blocks the confirm button, e.g. until a required reason is filled. */
  confirmDisabled?: boolean;
  /** Optional extra content below the message, e.g. a reason field. */
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  confirmDisabled = false,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          {destructive && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AlertTriangle className="size-4" />
            </div>
          )}
          <p className="text-sm text-muted">{description}</p>
        </div>
        {children}
      </div>
    </Modal>
  );
}
