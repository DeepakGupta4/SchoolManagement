"use client";

import React, { useMemo, useState } from "react";
import {
  Download,
  Fingerprint,
  KeyRound,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  useToast,
} from "@/components/ui";

/** Structural config: the app's permissionable modules (not seed records). */
const MODULES = [
  { id: "students", name: "Students" },
  { id: "teachers", name: "Teachers" },
  { id: "attendance", name: "Attendance" },
  { id: "fees", name: "Fees & Payments" },
  { id: "exams", name: "Exams & Results" },
  { id: "payroll", name: "Payroll" },
  { id: "transport", name: "Transport" },
  { id: "settings", name: "Settings" },
];

const ACTIONS = ["view", "create", "edit", "delete"] as const;
type ActionId = (typeof ACTIONS)[number];

export default function SecurityPage() {
  const { toast } = useToast();

  const [grants, setGrants] = useState<Record<string, ActionId[]>>({});
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");

  const togglePermission = (moduleId: string, action: ActionId) => {
    setGrants((prev) => {
      const current = prev[moduleId] ?? [];
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [moduleId]: next };
    });
  };

  const toggleModuleRow = (moduleId: string) => {
    setGrants((prev) => {
      const current = prev[moduleId] ?? [];
      const next: ActionId[] = current.length === ACTIONS.length ? [] : [...ACTIONS];
      return { ...prev, [moduleId]: next };
    });
  };

  const grantedCount = useMemo(
    () => Object.values(grants).reduce((sum, list) => sum + list.length, 0),
    [grants]
  );

  const handleSavePermissions = () => {
    toast({
      title: "Permissions saved",
      description: `${grantedCount} permissions across ${MODULES.length} modules.`,
      variant: "success",
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Security"
        description="Roles, permissions, audit trail and active device sessions."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Audit log exported",
                  description: "No audit events available to export yet.",
                  variant: "info",
                })
              }
            >
              <Download className="size-4" />
              Export audit log
            </Button>
            <Button onClick={handleSavePermissions}>
              <Save className="size-4" />
              Save permissions
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Roles configured" value={0} icon={UserCog} tone="indigo" />
        <StatCard label="Granted permissions" value={grantedCount} icon={KeyRound} tone="emerald" sub="Default module set" />
        <StatCard label="Active sessions" value={0} icon={Fingerprint} tone="cyan" />
        <StatCard label="Critical events (7d)" value={0} icon={ShieldAlert} tone="rose" />
      </div>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Module permissions</h2>
            <p className="mt-0.5 text-xs text-muted">
              Tick the actions allowed for each module. Changes apply on save.
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    Module
                  </th>
                  {ACTIONS.map((a) => (
                    <th
                      key={a}
                      scope="col"
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted"
                    >
                      {a}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    All
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod) => {
                  const list = grants[mod.id] ?? [];
                  return (
                    <tr key={mod.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-text">{mod.name}</td>
                      {ACTIONS.map((a) => (
                        <td key={a} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={list.includes(a)}
                            onChange={() => togglePermission(mod.id, a)}
                            aria-label={`${a} ${mod.name}`}
                            className="focus-ring size-4 cursor-pointer rounded-sm accent-primary"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleModuleRow(mod.id)}
                          className="focus-ring rounded-sm text-xs font-medium text-primary hover:underline"
                        >
                          {list.length === ACTIONS.length ? "Clear" : "Select all"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Audit log</h2>
            <p className="mt-0.5 text-xs text-muted">Every write action recorded with actor and IP.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-56">
              <Input
                type="search"
                placeholder="Search user, action or IP…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search audit log"
              />
            </div>
            <div className="w-40">
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                placeholder="All severities"
                options={[
                  { label: "Critical", value: "critical" },
                  { label: "High", value: "high" },
                  { label: "Info", value: "info" },
                  { label: "Low", value: "low" },
                ]}
                aria-label="Filter by severity"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No audit events yet"
            description="Write actions across the app will be recorded here with actor and IP."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Active sessions &amp; login history</h2>
            <p className="mt-0.5 text-xs text-muted">
              Revoke a device to force a fresh sign-in on the next request.
            </p>
          </div>
          <Badge variant="success">
            <ShieldCheck className="mr-1 size-3" />
            2FA enforced for staff
          </Badge>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No active sessions"
            description="Signed-in devices will appear here once users log in."
          />
        </CardContent>
      </Card>
    </div>
  );
}
