"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Input, Select } from "@/components/ui";
import {
  PERMISSION_MODULES,
  PERMISSION_LEVELS,
  PERMISSION_LEVEL_LABELS,
  type PermissionLevel,
  type PermissionMap,
} from "@/lib/permissions";
import { slugifyRoleKey, type CustomRole } from "@/lib/api/roles";

const LEVEL_OPTIONS = PERMISSION_LEVELS.map((v) => ({ value: v, label: PERMISSION_LEVEL_LABELS[v] }));
const GROUP_ORDER = ["People", "Academic", "Finance", "Operations", "Communication", "Insights"];

interface RoleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: CustomRole | null;
  /** Create-mode seed (e.g. cloning a built-in role): pre-fills name + permissions. */
  template?: { name: string; permissions: PermissionMap } | null;
  /** Existing roles — used to block a duplicate name/key on create. */
  existing?: CustomRole[];
  saving?: boolean;
  onSubmit: (values: Omit<CustomRole, "id">) => Promise<void>;
}

export function RoleFormModal({
  open,
  onOpenChange,
  record,
  template,
  existing = [],
  saving,
  onSubmit,
}: RoleFormModalProps) {
  const isEdit = Boolean(record);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Deferred so state isn't set synchronously in the effect (lint rule).
    const t = setTimeout(() => {
      setName(record?.name ?? template?.name ?? "");
      setDescription(record?.description ?? "");
      setPermissions({ ...(record?.permissions ?? template?.permissions ?? {}) });
      setError(null);
    }, 0);
    return () => clearTimeout(t);
  }, [open, record, template]);

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        modules: PERMISSION_MODULES.filter((m) => m.group === group),
      })).filter((g) => g.modules.length > 0),
    []
  );

  const setLevel = (key: string, level: PermissionLevel) =>
    setPermissions((prev) => {
      const next = { ...prev };
      if (level === "none") delete next[key];
      else next[key] = level;
      return next;
    });

  const grantedCount = Object.values(permissions).filter((l) => l === "view" || l === "edit").length;

  const takenKeys = useMemo(() => {
    const set = new Set<string>();
    for (const r of existing) {
      if (record && r.id === record.id) continue;
      set.add(r.key);
    }
    return set;
  }, [existing, record]);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Enter a role name (at least 2 characters).");
      return;
    }
    const key = isEdit ? record!.key : slugifyRoleKey(trimmed);
    if (key.length < 2) {
      setError("That name doesn't make a valid role key — include some letters or numbers.");
      return;
    }
    if (!isEdit && takenKeys.has(key)) {
      setError(`A role "${trimmed}" already exists. Pick a different name.`);
      return;
    }
    setError(null);
    await onSubmit({
      key,
      name: trimmed,
      description: description.trim(),
      permissions,
      isActive: record?.isActive ?? true,
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={isEdit ? "Edit role" : "Create role"}
      description="Choose which sections this role can open, and whether it can only view or also edit each."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create role"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Role name"
            required
            placeholder="e.g. Exam Coordinator"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error ?? undefined}
            hint={
              isEdit
                ? `Key: ${record?.key}`
                : name.trim()
                  ? `Key: ${slugifyRoleKey(name) || "—"}`
                  : "A short key is generated from the name."
            }
          />
          <Input
            label="Description (optional)"
            placeholder="What this role is for"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Section access</p>
          <p className="text-xs text-muted">
            {grantedCount} section{grantedCount === 1 ? "" : "s"} granted · everyone also gets the dashboard
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {grouped.map(({ group, modules }) => (
            <div key={group} className="overflow-hidden rounded-md border border-border">
              <p className="border-b border-border bg-surface-sunken px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {group}
              </p>
              <div className="divide-y divide-border">
                {modules.map((m) => {
                  const level = permissions[m.key] ?? "none";
                  return (
                    <div key={m.key} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span
                        className={
                          level === "none" ? "text-sm text-muted" : "text-sm font-medium text-text"
                        }
                      >
                        {m.label}
                      </span>
                      <div className="w-40 shrink-0">
                        <Select
                          value={level}
                          options={LEVEL_OPTIONS}
                          onChange={(e) => setLevel(m.key, e.target.value as PermissionLevel)}
                          aria-label={`${m.label} access`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="rounded-md bg-surface px-3 py-2 text-xs text-subtle">
          After saving, assign this role to a user in <span className="font-medium text-muted">User
          Management</span>. They sign in normally (or via <span className="font-medium text-muted">Others</span>)
          and see only what you granted here.
        </p>
      </div>
    </Modal>
  );
}
