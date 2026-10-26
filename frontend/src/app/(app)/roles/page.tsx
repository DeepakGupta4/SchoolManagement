"use client";

import { useMemo, useState } from "react";
import { Copy, KeyRound, Lock, Pencil, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  PageHeader,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { rolesApi, type CustomRole } from "@/lib/api/roles";
import { BUILTIN_ROLES, PERMISSION_MODULES, type PermissionMap } from "@/lib/permissions";
import { RoleFormModal } from "./RoleFormModal";

const moduleLabel = (key: string) => PERMISSION_MODULES.find((m) => m.key === key)?.label ?? key;

export default function RolesPage() {
  const [search, setSearch] = useState("");
  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    rolesApi,
    filters,
    { label: "role", describe: (r) => r.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [cloneTemplate, setCloneTemplate] = useState<{ name: string; permissions: PermissionMap } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomRole | null>(null);

  const stats = useMemo(() => {
    const active = items.filter((r) => r.isActive).length;
    return { total: items.length, active };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setCloneTemplate(null);
    setFormOpen(true);
  };

  /** Clone a built-in role into a new, fully-editable custom role. */
  const openClone = (b: (typeof BUILTIN_ROLES)[number]) => {
    setEditing(null);
    setCloneTemplate({ name: `${b.name} (custom)`, permissions: { ...b.defaultPermissions } });
    setFormOpen(true);
  };

  const handleSubmit = async (values: Omit<CustomRole, "id">) => {
    const ok = await save(values, editing);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
  };

  const columns: Column<CustomRole>[] = [
    {
      key: "name",
      header: "Role",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
            <KeyRound className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{r.name}</p>
            <p className="truncate text-xs text-subtle">{r.key}</p>
          </div>
        </div>
      ),
    },
    {
      key: "access",
      header: "Sections",
      render: (r) => {
        const keys = Object.entries(r.permissions ?? {})
          .filter(([, l]) => l === "view" || l === "edit")
          .map(([k]) => k);
        if (keys.length === 0) return <span className="text-subtle">Dashboard only</span>;
        const shown = keys.slice(0, 3).map(moduleLabel).join(", ");
        return (
          <div className="min-w-0">
            <p className="font-medium text-text">
              {keys.length} section{keys.length === 1 ? "" : "s"}
            </p>
            <p className="max-w-64 truncate text-xs text-subtle">
              {shown}
              {keys.length > 3 ? `, +${keys.length - 3} more` : ""}
            </p>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => (r.isActive ? 1 : 0),
      render: (r) =>
        r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(r);
              setCloneTemplate(null);
              setFormOpen(true);
            }}
            aria-label={`Edit ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(r)}
            aria-label={`Delete ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Roles & Permissions"
        description="Create custom roles and choose exactly what each one can see and edit."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Create Role
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Custom roles" value={stats.total} icon={KeyRound} tone="indigo" />
        <StatCard label="Active" value={stats.active} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Grantable sections" value={PERMISSION_MODULES.length} icon={Users} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search roles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search roles"
          />
        </div>
        <p className="text-xs text-muted">{items.length} roles</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No custom roles yet"
          emptyDescription="Create a role, choose its sections, then assign it to a user in User Management."
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Create Role
            </Button>
          }
        />
      )}

      {/* Built-in roles — shown for reference; clone one into an editable custom
          role. super_admin is intentionally absent (platform owner, not a school
          role). The built-in roles themselves keep their fixed, tested access. */}
      <Card>
        <CardHeader className="flex-col items-stretch gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted" />
            <h2 className="text-sm font-semibold text-text">Built-in roles</h2>
          </div>
          <p className="text-xs text-muted">
            The standard roles and what they cover. Clone any one to create a custom role you can
            tailor — the built-in roles themselves stay fixed so their tested behaviour never breaks.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {BUILTIN_ROLES.map((b) => {
              const count = Object.values(b.defaultPermissions).filter(
                (l) => l === "view" || l === "edit"
              ).length;
              return (
                <div
                  key={b.role}
                  className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-text">{b.name}</p>
                    <Badge variant="default" className="gap-1">
                      <Lock className="size-3" />
                      Built-in
                    </Badge>
                  </div>
                  <p className="min-h-8 text-xs text-subtle">{b.note}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">
                      {count > 0 ? `${count} section${count === 1 ? "" : "s"}` : "Full / portal access"}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => openClone(b)}>
                      <Copy className="size-3.5" />
                      Clone
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <RoleFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        template={cloneTemplate}
        existing={items}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete role?"
        description={
          pendingDelete
            ? `The role "${pendingDelete.name}" will be removed. Users still assigned to it will lose access until you give them another role. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
