"use client";

import { useState } from "react";
import { Check, Copy, Mail, TriangleAlert } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import type { UserCredentials } from "@/lib/api/users";

/**
 * Shows a newly-created or reset login's credentials ONCE. The password is never
 * retrievable again, so the admin copies/relays it here; it's also emailed to the
 * user when email delivery is configured.
 */
export function CredentialsDialog({
  data,
  emailed,
  title,
  onClose,
}: {
  data: UserCredentials | null;
  emailed: boolean;
  title?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, value: string) => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(label);
        setTimeout(() => setCopied(null), 1500);
      })
      .catch(() => {});
  };

  return (
    <Modal
      open={Boolean(data)}
      onOpenChange={(o) => !o && onClose()}
      size="sm"
      title={title ?? "Login credentials"}
      description="Share these with the user — the password is shown only once."
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {data && (
        <div className="flex flex-col gap-3">
          {([
            ["Email", data.email],
            ["Password", data.password],
          ] as const).map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs text-subtle">{label}</p>
                <p className="truncate font-mono text-sm text-text">{value}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copy(label, value)}>
                {copied === label ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied === label ? "Copied" : "Copy"}
              </Button>
            </div>
          ))}
          <div
            className={
              emailed
                ? "inline-flex items-center gap-1.5 text-xs text-success-text"
                : "inline-flex items-center gap-1.5 text-xs text-warning-text"
            }
          >
            {emailed ? <Mail className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
            {emailed
              ? "Emailed to the user."
              : "Email not sent (delivery not configured) — share these manually."}
          </div>
        </div>
      )}
    </Modal>
  );
}
