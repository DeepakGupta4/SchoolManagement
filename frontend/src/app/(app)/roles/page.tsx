"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Info, KeyRound, Lock, Pencil, Plus, Search, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  Modal,
  PageHeader,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { rolesApi, type CustomRole } from "@/lib/api/roles";
import { listUsers, type ManagedUser } from "@/lib/api/users";
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

  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [cloneTemplate, setCloneTemplate] = useState<{ name: string; permissions: PermissionMap } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomRole | null>(null);
  // After creating a role, prompt to add a user with it (role != login).
  const [justCreated, setJustCreated] = useState<{ name: string; roleValue: string } | null>(null);

  /** Jump to User Management, pre-opening "Add user" with this role selected. */
  const addUserWithRole = (roleValue: string) => {
    setJustCreated(null);
    router.push(`/users?role=${encodeURIComponent(roleValue)}`);
  };

  // Existing accounts in THIS school, so every role shows who actually holds it
  // (the created admin, principal, teachers, …) — not just the role definition.
  const [users, setUsers] = useState<ManagedUser[]>([]);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      listUsers()
        .then((data) => {
          if (!cancelled) setUsers(data);
        })
        .catch(() => {
          /* non-critical — the page still shows the role definitions */
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  /** Accounts holding a role — a built-in role string, or "custom:<key>". */
  const holdersFor = (roleValue: string): ManagedUser[] => {
    if (roleValue.startsWith("custom:")) {
      const key = roleValue.slice("custom:".length);
      return users.filter((u) => u.role === "custom" && (u.customRoleKey ?? "") === key);
    }
    return users.filter((u) => u.role === roleValue);
  };

  const stats = useMemo(() => {
    const active = items.filter((r) => r.isActive).length;
    return { total: items.length, active, accounts: users.length };
  }, [items, users]);

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
    const wasCreate = !editing;
    const ok = await save(values, editing);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
      setCloneTemplate(null);
      // A new role has no users yet — nudge the admin to add one so someone can
      // actually log in with it.
      if (wasCreate) setJustCreated({ name: values.name, roleValue: `custom:${values.key}` });
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
      key: "accounts",
      header: "Accounts",
      render: (r) => {
        const h = holdersFor(`custom:${r.key}`);
        if (h.length === 0) return <span className="text-subtle">None yet</span>;
        return (
          <div className="min-w-0">
            <p className="font-medium text-text">
              {h.length} user{h.length === 1 ? "" : "s"}
            </p>
            <p className="max-w-56 truncate text-xs text-subtle">
              {h.slice(0, 2).map((u) => u.name).join(", ")}
              {h.length > 2 ? `, +${h.length - 2} more` : ""}
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
            onClick={() => addUserWithRole(`custom:${r.key}`)}
            title="Add a user with this role"
            aria-label={`Add a user with ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <UserPlus className="size-4" />
          </button>
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

      <div className="flex items-start gap-2.5 rounded-md border border-border bg-primary-soft/30 px-3.5 py-2.5 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary-text" />
        <p className="text-muted">
          A role is a <span className="font-medium text-text">permission template</span>, not a login. Create a
          role here, then open <span className="font-medium text-text">User Management</span> to add a person
          (name, email, password) and give them a role — many people can share one role.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Custom roles" value={stats.total} icon={KeyRound} tone="indigo" />
        <StatCard label="Active" value={stats.active} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Accounts" value={stats.accounts} icon={UserPlus} tone="amber" />
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
            The standard roles and what they cover, plus the accounts in your school that currently
            hold each one. Clone any role to create a custom role you can tailor — the built-in roles
            themselves stay fixed so their tested behaviour never breaks.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {BUILTIN_ROLES.map((b) => {
              const count = Object.values(b.defaultPermissions).filter(
                (l) => l === "view" || l === "edit"
              ).length;
              const holders = holdersFor(b.role);
              const isSingleton = b.role === "school_admin" || b.role === "principal";
              const slotFilled = isSingleton && holders.some((h) => h.isActive !== false);
              return (
                <div
                  key={b.role}
                  className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium text-text">{b.name}</p>
                      {holders.length > 0 && <Badge variant="info">{holders.length}</Badge>}
                    </div>
                    <Badge variant="default" className="shrink-0 gap-1">
                      <Lock className="size-3" />
                      Built-in
                    </Badge>
                  </div>
                  <p className="text-xs text-subtle">{b.note}</p>

                  {/* Accounts in THIS school that currently hold this role. */}
                  <div className="rounded-md border border-border bg-surface-hover p-2">
                    {holders.length === 0 ? (
                      <p className="text-xs text-subtle">
                        {isSingleton ? "Not assigned yet" : "No accounts yet"}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {holders.slice(0, 3).map((u) => (
                          <li key={u.id} className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-text">{u.name}</p>
                              <p className="truncate text-[11px] text-subtle">{u.email}</p>
                            </div>
                            {u.isActive === false && <Badge variant="default" className="shrink-0">Inactive</Badge>}
                          </li>
                        ))}
                        {holders.length > 3 && (
                          <li className="text-[11px] text-muted">+{holders.length - 3} more</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-muted">
                      {count > 0 ? `${count} section${count === 1 ? "" : "s"}` : "Full / portal access"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!slotFilled && (
                        <Button variant="ghost" size="sm" onClick={() => addUserWithRole(b.role)}>
                          <UserPlus className="size-3.5" />
                          Add
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openClone(b)}>
                        <Copy className="size-3.5" />
                        Clone
                      </Button>
                    </div>
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

      {/* After creating a role, bridge the role→login gap explicitly. */}
      <Modal
        open={Boolean(justCreated)}
        onOpenChange={(o) => !o && setJustCreated(null)}
        size="sm"
        title="Role created"
        description={
          justCreated
            ? `"${justCreated.name}" is ready. A role is just permissions — add a user (a login) and give them this role so they can sign in.`
            : ""
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setJustCreated(null)}>
              Later
            </Button>
            <Button onClick={() => justCreated && addUserWithRole(justCreated.roleValue)}>
              <UserPlus className="size-4" />
              Add a user with this role
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          You&rsquo;ll enter the person&rsquo;s name &amp; email next, and they&rsquo;ll get a password to
          sign in with — already carrying this role&rsquo;s access.
        </p>
      </Modal>
    </div>
  );
}
