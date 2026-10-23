"use client";

import React, { useEffect, useState } from "react";
import {
  Download, Fingerprint, KeyRound, Loader2,
  RefreshCw, Search, ShieldAlert, ShieldCheck, UserCog,
} from "lucide-react";
import {
  Badge, Button, Card, CardContent, CardHeader,
  EmptyState, Input, PageHeader, Pagination, Select, StatCard, useToast,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { listAuditLogs, type AuditEntry } from "@/lib/api/audit";

const ACTION_OPTIONS = [
  { label: "Impersonate", value: "impersonate" },
  { label: "Reset password", value: "reset_password" },
];

const PAGE_SIZE = 20;

function actionBadge(action: string) {
  if (action === "impersonate") return "warning";
  if (action === "reset_password") return "info";
  return "default";
}

export default function SecurityPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await listAuditLogs({ search, action, page: p, limit: PAGE_SIZE });
      setLogs(res.data);
      setTotal(res.meta.total);
      setPages(res.meta.pages);
    } catch {
      toast({ title: "Could not load audit log", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); setPage(1); }, [search, action]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = () => {
    if (logs.length === 0) { toast({ title: "Nothing to export", variant: "warning" }); return; }
    exportToCsv<AuditEntry>("audit-log", [
      { header: "Time", value: (e) => new Date(e.createdAt).toLocaleString("en-IN") },
      { header: "Action", value: (e) => e.action },
      { header: "Performed by", value: (e) => e.performedBy },
      { header: "Target school", value: (e) => e.targetSchoolId ?? "" },
      { header: "IP", value: (e) => e.ip ?? "" },
    ], logs);
    toast({ title: "Exported", description: `${logs.length} entries.` });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Security"
        description="Audit trail of sensitive platform actions."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" /> Export
            </Button>
            <Button variant="outline" onClick={() => load(page)}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total events" value={total} icon={ShieldAlert} tone="rose" />
        <StatCard label="Impersonations" value={logs.filter(l => l.action === "impersonate").length} icon={UserCog} tone="amber" />
        <StatCard label="Password resets" value={logs.filter(l => l.action === "reset_password").length} icon={KeyRound} tone="indigo" />
        <StatCard label="Active sessions" value={0} icon={Fingerprint} tone="cyan" />
      </div>

      <Card>
        <CardHeader className="flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-text">Audit log</h2>
            <p className="mt-0.5 text-xs text-muted">Every sensitive action with actor and IP.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-56">
              <Input type="search" placeholder="Search actor, action, IP…" value={search}
                onChange={(e) => setSearch(e.target.value)} icon={<Search className="size-4" />} />
            </div>
            <div className="w-44">
              <Select value={action} onChange={(e) => setAction(e.target.value)}
                placeholder="All actions" options={ACTION_OPTIONS} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-muted" /></div>
          ) : logs.length === 0 ? (
            <EmptyState title="No audit events yet"
              description="Sensitive actions (impersonation, password resets) will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-xs uppercase tracking-wide text-subtle">
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Performed by</th>
                    <th className="px-4 py-3 font-semibold">Target school</th>
                    <th className="px-4 py-3 font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {new Date(e.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={actionBadge(e.action)}>{e.action}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-text">{e.performedBy}</td>
                      <td className="px-4 py-3 text-muted">{e.targetSchoolId ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">{e.ip ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={total} onPageChange={setPage} />

      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-text">Active sessions</h2>
            <p className="mt-0.5 text-xs text-muted">Signed-in devices will appear here once users log in.</p>
          </div>
          <Badge variant="success"><ShieldCheck className="mr-1 size-3" />Sessions tracked</Badge>
        </CardHeader>
        <CardContent>
          <EmptyState title="No active sessions" description="Session tracking via refresh tokens is active." />
        </CardContent>
      </Card>
    </div>
  );
}
