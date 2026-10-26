"use client";

import { useState } from "react";
import { Modal, Button, Input, useToast } from "@/components/ui";
import { changeMyPassword } from "@/lib/api/auth";

/**
 * Self-service "change my password" for the signed-in user — available to EVERY
 * role from the account menu (custom roles can't open Settings, so this is their
 * only way to it). Hits PATCH /api/auth/me/password, which verifies the current
 * password server-side and isn't role-gated.
 */
export function ChangePasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  };

  const close = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const submit = async () => {
    if (!current) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("The new passwords don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await changeMyPassword(current, next);
      toast({ title: "Password updated", description: "Use your new password next time.", variant: "success" });
      reset();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      size="sm"
      title="Change password"
      description="Enter your current password and choose a new one."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Update password"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Current password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />
        <Input
          label="New password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={error ?? undefined}
        />
      </div>
    </Modal>
  );
}
