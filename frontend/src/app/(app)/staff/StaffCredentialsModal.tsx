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
import type { UserRole } from "@/types";
import type { StaffMember } from "@/lib/api/staff";

/**
 * Picks the login role a staff member should get from their department, so a
 * driver account reaches the driver app, a librarian the library, etc. Anything
 * else falls back to the generic "staff" portal.
 */
export function loginRoleForStaff(dept: string): UserRole {
  const d = (dept ?? "").toLowerCase();
  if (d.includes("transport")) return "driver";
  if (d.includes("library")) return "librarian";
  if (d.includes("finance")) return "accountant";
  return "staff";
}

const ROLE_LABEL: Record<string, string> = {
  driver: "Driver",
  librarian: "Librarian",
  accountant: "Accountant",
  staff: "Staff",
};

/**
 * Create or reset the LOGIN account for a staff member. The staff record and the
 * login account are separate things, linked by email — this shows what exists
 * for that email, then hands the one-time credentials back to the parent.
 * (Mirrors TeacherCredentialsModal.)
 */
export function StaffCredentialsModal({
  staff,
  onClose,
  onDone,
}: {
  staff: StaffMember | null;
  onClose: () => void;
  onDone: (creds: UserCredentials, emailed: boolean, action: "created" | "reset") => void;
}) {
  const { toast } = useToast();
  const [result, setResult] = useState<{ email: string; existing: ManagedUser | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = (staff?.email ?? "").trim();
  const role = loginRoleForStaff(staff?.dept ?? "");

  // On open, look up whether a login already exists for this staff member's email.
  useEffect(() => {
    if (!staff || !email) return;
    let cancelled = false;
    listUsers()
      .then((users) => {
        if (cancelled) return;
        const lower = email.toLowerCase();
        setResult({ email, existing: users.find((u) => u.email.toLowerCase() === lower) ?? null });
        setError(null);
      })
      .catch(() => {
        // Best-effort — treat as "no login" (createUser 409s if one already exists).
        if (!cancelled) {
          setResult({ email, existing: null });
          setError(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [staff, email]);

  // Derived — a stale result from a previously-opened staff member never shows.
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
      // "already exists" on create → the email has a login. If it's one in THIS
      // school, re-check and switch to the reset action so the admin can change
      // its password right here instead of being stuck.
      if (action === "created" && /already exists/i.test(msg)) {
        try {
          const users = await listUsers();
          const lower = email.toLowerCase();
          const found = users.find((u) => u.email.toLowerCase() === lower);
          if (found) {
            setResult({ email, existing: found }); // footer becomes "Reset password"
            setError(null);
            return;
          }
        } catch {
          /* ignore — fall through to the error below */
        }
      }
      setError(msg); // persistent, in the modal
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
      onClick={() => run(() => createUser({ name: staff!.name, email, role }), "created")}
      disabled={busy || finding}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
      Create login
    </Button>
  );

  const takenElsewhere = Boolean(error) && /already exists/i.test(error ?? "");

  return (
    <Modal
      open={Boolean(staff)}
      onOpenChange={(o) => !o && onClose()}
      size="sm"
      title="Login credentials"
      description={staff ? staff.name : ""}
      footer={footer}
    >
      {!staff ? null : !email ? (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-warning-text">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>This staff member has no email address. Add one on their record first, then create a login.</span>
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
                {existing
                  ? `Login exists · ${existing.role.replace("_", " ")}`
                  : `No login yet · will be created as ${ROLE_LABEL[role] ?? role}`}
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
                    another account. Give this staff member a different email, then try again.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {existing
                ? "Generate a new one-time password for this staff member. Their old password stops working immediately."
                : "Create a login so this staff member can sign in to the app. A one-time password is generated (and emailed)."}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
