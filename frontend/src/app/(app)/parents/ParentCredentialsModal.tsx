"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, RefreshCw, TriangleAlert, UserPlus } from "lucide-react";
import { Modal, Button, useToast } from "@/components/ui";
import {
  listUsers,
  createUser,
  resetUserPassword,
  type ManagedUser,
  type UserCredentials,
} from "@/lib/api/users";
import type { ParentDirectoryEntry } from "@/lib/api/parent";

/**
 * Create or reset the parent-portal LOGIN for a guardian — the same one-time-
 * credentials flow teachers and staff use. The parent record and the login are
 * separate, linked by email; the portal then shows that parent only their own
 * children (matched on the same email). Mirrors TeacherCredentialsModal.
 */
export function ParentCredentialsModal({
  parent,
  onClose,
  onDone,
}: {
  parent: ParentDirectoryEntry | null;
  onClose: () => void;
  onDone: (creds: UserCredentials, emailed: boolean, action: "created" | "reset") => void;
}) {
  const { toast } = useToast();
  const [result, setResult] = useState<{ email: string; existing: ManagedUser | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = (parent?.email ?? "").trim();

  // On open, look up whether a login already exists for this parent's email.
  useEffect(() => {
    if (!parent || !email) return;
    let cancelled = false;
    listUsers()
      .then((users) => {
        if (cancelled) return;
        const lower = email.toLowerCase();
        setResult({ email, existing: users.find((u) => u.email.toLowerCase() === lower) ?? null });
        setError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ email, existing: null });
          setError(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [parent, email]);

  const ready = result?.email === email;
  const finding = Boolean(email) && !ready;
  const existing = ready ? result.existing : null;

  const run = async (
    fn: () => Promise<{ credentials: UserCredentials; emailed: boolean }>,
    action: "created" | "reset"
  ) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      onDone(res.credentials, res.emailed, action);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      // "already exists" on create → the email has a login; switch to reset.
      if (action === "created" && /already exists/i.test(msg)) {
        try {
          const users = await listUsers();
          const lower = email.toLowerCase();
          const found = users.find((u) => u.email.toLowerCase() === lower);
          if (found) {
            setResult({ email, existing: found });
            setError(null);
            return;
          }
        } catch {
          /* fall through */
        }
      }
      setError(msg);
      toast({
        title: action === "created" ? "Could not create login" : "Could not reset password",
        description: msg,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const footer = !email ? (
    <Button variant="outline" onClick={onClose}>
      Close
    </Button>
  ) : existing ? (
    <Button onClick={() => run(() => resetUserPassword(existing.id), "reset")} disabled={busy || finding}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Reset password
    </Button>
  ) : (
    <Button
      onClick={() => run(() => createUser({ name: parent!.name, email, role: "parent" }), "created")}
      disabled={busy || finding}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
      Create login
    </Button>
  );

  const takenElsewhere = Boolean(error) && /already exists/i.test(error ?? "");

  return (
    <Modal
      open={Boolean(parent)}
      onOpenChange={(o) => !o && onClose()}
      size="sm"
      title="Parent portal login"
      description={parent ? parent.name : ""}
      footer={footer}
    >
      {!parent ? null : !email ? (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-warning-text">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>This parent has no email address. Add one on their record first, then create a login.</span>
        </div>
      ) : finding ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" /> Checking for an existing login…
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5">
            <KeyRound className="size-4 shrink-0 text-muted" />
            <div className="min-w-0">
              <p className="truncate font-mono text-sm text-text">{email}</p>
              <p className="text-xs text-subtle">
                {existing ? `Login exists · ${existing.role.replace("_", " ")}` : "No login yet · will be created as Parent"}
              </p>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger-text">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p>{error}</p>
                {takenElsewhere ? (
                  <p className="mt-1 text-xs">
                    Every login email must be unique across the whole system — this one already belongs to
                    another account. Give this parent a different email, then try again.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {existing
                ? "Generate a new one-time password for this parent. Their old password stops working immediately."
                : "Create a portal login so this parent can sign in and see their own children. A one-time password is generated (and emailed)."}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
