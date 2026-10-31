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
import { teacherName, type Teacher } from "@/types/teacher";

/**
 * Create or reset the LOGIN account for a teacher. The teacher record and the
 * login account are separate things, linked by email — this shows what exists
 * for that email, then hands the one-time credentials back to the parent.
 */
export function TeacherCredentialsModal({
  teacher,
  onClose,
  onDone,
}: {
  teacher: Teacher | null;
  onClose: () => void;
  onDone: (creds: UserCredentials, emailed: boolean, action: "created" | "reset") => void;
}) {
  const { toast } = useToast();
  const [result, setResult] = useState<{ email: string; existing: ManagedUser | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const email = (teacher?.email ?? "").trim();

  // On open, look up whether a login already exists for this teacher's email.
  useEffect(() => {
    if (!teacher || !email) return;
    let cancelled = false;
    listUsers()
      .then((users) => {
        if (cancelled) return;
        const lower = email.toLowerCase();
        setResult({ email, existing: users.find((u) => u.email.toLowerCase() === lower) ?? null });
      })
      .catch(() => {
        // Best-effort — treat as "no login" (createUser 409s if one already exists).
        if (!cancelled) setResult({ email, existing: null });
      });
    return () => {
      cancelled = true;
    };
  }, [teacher, email]);

  // Derived (the effect never setStates synchronously, and a stale result from a
  // previously-opened teacher never shows).
  const ready = result?.email === email;
  const finding = Boolean(email) && !ready;
  const existing = ready ? result.existing : null;

  const run = async (
    fn: () => Promise<{ credentials: UserCredentials; emailed: boolean }>,
    action: "created" | "reset"
  ) => {
    setBusy(true);
    try {
      const res = await fn();
      onDone(res.credentials, res.emailed, action);
      onClose();
    } catch (e) {
      toast({
        title: action === "created" ? "Could not create login" : "Could not reset password",
        description: e instanceof Error ? e.message : "Something went wrong.",
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
      onClick={() => run(() => createUser({ name: teacherName(teacher!), email, role: "teacher" }), "created")}
      disabled={busy || finding}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
      Create login
    </Button>
  );

  return (
    <Modal
      open={Boolean(teacher)}
      onOpenChange={(o) => !o && onClose()}
      size="sm"
      title="Login credentials"
      description={teacher ? teacherName(teacher) : ""}
      footer={footer}
    >
      {!teacher ? null : !email ? (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-warning-text">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>This teacher has no email address. Add one on their record first, then create a login.</span>
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
                {existing ? `Login exists · ${existing.role.replace("_", " ")}` : "No login account yet"}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted">
            {existing
              ? "Generate a new one-time password for this teacher. Their old password stops working immediately."
              : "Create a login so this teacher can sign in to the app. A one-time password is generated (and emailed)."}
          </p>
        </div>
      )}
    </Modal>
  );
}
