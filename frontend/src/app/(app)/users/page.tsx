"use client";

import React, { useEffect, useState } from "react";
import { KeyRound, Loader2, RefreshCw, Search, ShieldCheck, Sparkles, UserCog, UserPlus, Users } from "lucide-react";
import {
  Avatar, Badge, Button, Card, CardContent, CardHeader, CredentialsDialog,
  EmptyState, Input, Modal, PageHeader, Select, StatCard, useToast,
} from "@/components/ui";
import {
  listUsers, updateUser, createUser, resetUserPassword, addSampleStaff,
  type ManagedUser, type UserCredentials, type SampleStaffResult,
} from "@/lib/api/users";
import { rolesApi, type CustomRole } from "@/lib/api/roles";
import { useAuthStore } from "@/store";

const BUILTIN_ROLE_OPTIONS = [
  { label: "School Admin", value: "school_admin" },
  { label: "Principal", value: "principal" },
  { label: "Teacher", value: "teacher" },
  { label: "Accountant", value: "accountant" },
  { label: "Librarian", value: "librarian" },
  { label: "Staff", value: "staff" },
  { label: "Driver", value: "driver" },
  { label: "Parent", value: "parent" },
  { label: "Student", value: "student" },
];

/** A custom role is encoded in the role <Select> as "custom:<key>". */
const CUSTOM_PREFIX = "custom:";

export default function UsersPage() {
  const { toast } = useToast();
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Create-account modal.
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("teacher");
  const [adding, setAdding] = useState(false);

  // Credentials popup, shown once after a create or password-reset.
  const [creds, setCreds] = useState<UserCredentials | null>(null);
  const [credsEmailed, setCredsEmailed] = useState(false);

  // One-click sample-staff onboarding.
  const [sampling, setSampling] = useState(false);
  const [sampleResult, setSampleResult] = useState<SampleStaffResult | null>(null);

  // Built-in roles plus any custom roles the school has defined.
  const roleOptions = [
    ...BUILTIN_ROLE_OPTIONS,
    ...customRoles
      .filter((r) => r.isActive)
      .map((r) => ({ label: `Custom: ${r.name}`, value: `${CUSTOM_PREFIX}${r.key}` })),
  ];
  const customRoleName = (key: string | undefined) =>
    customRoles.find((r) => r.key === key)?.name;

  // One school_admin and one principal per school: find the current ACTIVE holder
  // of each singleton role so those options can be greyed out where they'd clash.
  const singletonHolderId: Record<string, string | undefined> = {};
  for (const u of users) {
    if (u.isActive !== false && (u.role === "school_admin" || u.role === "principal")) {
      singletonHolderId[u.role] = u.id;
    }
  }
  /** Disable a taken singleton role, except for the user who already holds it. */
  const gateSingletons = (currentUserId?: string) =>
    roleOptions.map((o) =>
      (o.value === "school_admin" || o.value === "principal") &&
      singletonHolderId[o.value] &&
      singletonHolderId[o.value] !== currentUserId
        ? { ...o, label: `${o.label} — already assigned`, disabled: true }
        : o
    );
  const addRoleOptions = gateSingletons();
  const editRoleOptions = gateSingletons(editing?.id);

  const load = async () => {
    setLoading(true);
    try {
      const [data, roles] = await Promise.all([
        listUsers(),
        rolesApi.list({}).catch(() => [] as CustomRole[]),
      ]);
      setUsers(data);
      setCustomRoles(roles);
    } catch {
      toast({ title: "Could not load users", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Deferred so state isn't set synchronously in the effect (set-state-in-effect).
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep-link from Roles & Permissions ("Add a user with this role") — open the
  // Add-user modal with that role pre-selected, then clean the URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = new URLSearchParams(window.location.search).get("role");
    if (!role) return;
    window.history.replaceState(null, "", "/users");
    const t = setTimeout(() => {
      setAddName("");
      setAddEmail("");
      setAddRole(role);
      setAddOpen(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const openEdit = (u: ManagedUser) => {
    setEditing(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role === "custom" ? `${CUSTOM_PREFIX}${u.customRoleKey ?? ""}` : u.role);
    setEditActive(u.isActive !== false);
  };

  const openAdd = () => {
    setAddName("");
    setAddEmail("");
    setAddRole("teacher");
    setAddOpen(true);
  };

  const showCredentials = (c: UserCredentials, emailed: boolean) => {
    setCreds(c);
    setCredsEmailed(emailed);
  };

  const handleCreate = async () => {
    const name = addName.trim();
    const email = addEmail.trim();
    if (name.length < 2 || !email) {
      toast({ title: "Enter a name and email", variant: "error" });
      return;
    }
    setAdding(true);
    try {
      const isCustom = addRole.startsWith(CUSTOM_PREFIX);
      const result = await createUser({
        name,
        email,
        role: (isCustom ? "custom" : addRole) as ManagedUser["role"],
        customRoleKey: isCustom ? addRole.slice(CUSTOM_PREFIX.length) : undefined,
      });
      setAddOpen(false);
      await load();
      showCredentials(result.credentials, result.emailed);
      toast({ title: "Account created", variant: "success" });
    } catch (e) {
      toast({
        title: "Could not create account",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "error",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleReset = async () => {
    if (!editing) return;
    setResetting(true);
    try {
      const result = await resetUserPassword(editing.id);
      setEditing(null);
      showCredentials(result.credentials, result.emailed);
      toast({ title: "Password reset", variant: "success" });
    } catch (e) {
      toast({
        title: "Could not reset password",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "error",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleSampleStaff = async () => {
    setSampling(true);
    try {
      const result = await addSampleStaff();
      await load();
      setSampleResult(result);
    } catch (e) {
      toast({
        title: "Could not add sample staff",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSampling(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const isCustom = editRole.startsWith(CUSTOM_PREFIX);
      const updated = await updateUser(editing.id, {
        name: editName.trim() || undefined,
        email: editEmail.trim() || undefined,
        role: (isCustom ? "custom" : editRole) as ManagedUser["role"],
        customRoleKey: isCustom ? editRole.slice(CUSTOM_PREFIX.length) : "",
        isActive: editActive,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setEditing(null);
      toast({ title: "User updated", variant: "success" });
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const active = users.filter((u) => u.isActive !== false).length;
  const admins = users.filter((u) => u.role === "school_admin" || u.role === "principal").length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="User Management"
        description="Manage login accounts for your school."
        actions={
          <>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button variant="outline" onClick={handleSampleStaff} disabled={sampling}>
              {sampling ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Sample staff
            </Button>
            <Button onClick={openAdd}>
              <UserPlus className="size-4" /> Add user
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total accounts" value={users.length} icon={Users} tone="indigo" />
        <StatCard label="Active" value={active} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Admins & Principals" value={admins} icon={UserCog} tone="amber" />
      </div>

      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-text">All accounts</h2>
            <p className="mt-0.5 text-xs text-muted">Click Edit to change name, role or status.</p>
          </div>
          <div className="w-56">
            <Input type="search" placeholder="Search name, email, role…" value={search}
              onChange={(e) => setSearch(e.target.value)} icon={<Search className="size-4" />} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-6 animate-spin text-muted" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No accounts found" description="Try a different search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-xs uppercase tracking-wide text-subtle">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={u.avatar || undefined} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text">{u.name}</p>
                            <p className="truncate text-xs text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">
                          {u.role === "custom"
                            ? (customRoleName(u.customRoleKey) ?? "Custom role")
                            : u.role.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive !== false ? "success" : "danger"}>
                          {u.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== me?.id && (
                          <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Edit</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit user"
        description={editing?.email ?? ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Display name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input
            label="Login email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            hint="The email this user signs in with."
          />
          <Select label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value)} options={editRoleOptions} />
          <Select
            label="Status"
            value={editActive ? "active" : "inactive"}
            onChange={(e) => setEditActive(e.target.value === "active")}
            options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]}
          />
          <div className="rounded-md border border-border bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">Password</p>
                <p className="text-xs text-subtle">
                  Passwords can&rsquo;t be viewed. Reset to generate a new one (shown once &amp; emailed).
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={resetting}>
                {resetting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create account */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add user"
        description="Create a login. A temporary password is generated, shown once and emailed."
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={adding}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : null}
              Create account
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Full name" required value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Priya Sharma" />
          <Input label="Login email" required type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="priya@school.edu" />
          <Select label="Role" value={addRole} onChange={(e) => setAddRole(e.target.value)} options={addRoleOptions} />
          <p className="rounded-md bg-surface px-3 py-2 text-xs text-subtle">
            No password needed — a secure one is generated, emailed to the user, and shown to you once.
          </p>
        </div>
      </Modal>

      <CredentialsDialog data={creds} emailed={credsEmailed} onClose={() => setCreds(null)} />

      {/* Sample-staff results */}
      <Modal
        open={Boolean(sampleResult)}
        onOpenChange={(o) => !o && setSampleResult(null)}
        title="Sample staff ready"
        description="Ready-to-use accounts in your school — the shared password is shown once."
        footer={<Button onClick={() => setSampleResult(null)}>Done</Button>}
      >
        {sampleResult && (
          <div className="flex flex-col gap-3">
            {sampleResult.created.length > 0 ? (
              <>
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <p className="text-xs text-subtle">Shared password (all sample accounts)</p>
                  <p className="font-mono text-sm text-text">{sampleResult.password}</p>
                </div>
                <div className="overflow-hidden rounded-md border border-border">
                  {sampleResult.created.map((c) => (
                    <div
                      key={c.email}
                      className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-sm last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-text">{c.name}</span>
                        <span className="ml-1 text-xs capitalize text-subtle">({c.role})</span>
                      </span>
                      <span className="truncate font-mono text-xs text-muted">{c.email}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">All sample accounts already exist in your school.</p>
            )}
            <p className="text-xs text-subtle">
              {sampleResult.emailed > 0 ? `${sampleResult.emailed} emailed. ` : ""}
              {sampleResult.skipped.length > 0 && sampleResult.created.length > 0
                ? `${sampleResult.skipped.length} already existed. `
                : ""}
              These are normal accounts — edit, reset or delete them anytime.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
