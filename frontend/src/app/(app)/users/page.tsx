"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, Search, ShieldCheck, UserCog, Users } from "lucide-react";
import {
  Avatar, Badge, Button, Card, CardContent, CardHeader,
  EmptyState, Input, Modal, PageHeader, Select, StatCard, useToast,
} from "@/components/ui";
import { listUsers, updateUser, type ManagedUser } from "@/lib/api/users";
import { useAuthStore } from "@/store";

const ROLE_OPTIONS = [
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

export default function UsersPage() {
  const { toast } = useToast();
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch {
      toast({ title: "Could not load users", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const openEdit = (u: ManagedUser) => {
    setEditing(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditActive(u.isActive !== false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await updateUser(editing.id, {
        name: editName.trim() || undefined,
        role: editRole as ManagedUser["role"],
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
          <Button variant="outline" onClick={load}>
            <Plus className="size-4" /> Refresh
          </Button>
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
                        <Badge variant="info">{u.role.replace("_", " ")}</Badge>
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
          <Select label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value)} options={ROLE_OPTIONS} />
          <Select
            label="Status"
            value={editActive ? "active" : "inactive"}
            onChange={(e) => setEditActive(e.target.value === "active")}
            options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]}
          />
        </div>
      </Modal>
    </div>
  );
}
