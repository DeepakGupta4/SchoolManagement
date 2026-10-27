"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Library, BookOpen, BookCheck, Boxes, ArrowRight } from "lucide-react";
import { Card, CardContent, Skeleton } from "@/components/ui";
import { apiList } from "@/lib/api/client";
import { useEntitlementsStore } from "@/store";
import { hrefInTier } from "@/lib/permissions";

interface BookRow {
  total?: number;
  available?: number;
}
interface LibStats {
  titles: number;
  copies: number;
  available: number;
  issued: number;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Library; label: string; value: string; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-md ${tone}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="text-xl font-bold leading-none text-text">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function LibrarianDashboard() {
  const [stats, setStats] = useState<LibStats | null>(null);
  // Library is a Standard+ module; if this school's plan excludes it, don't call
  // /api/books (it 402s) and show an upgrade note instead of a dead catalog link.
  const tierModules = useEntitlementsStore((s) => s.tierModules);
  const libInTier = hrefInTier("/library", tierModules);

  useEffect(() => {
    if (!libInTier) return;
    let cancelled = false;
    apiList<BookRow>("/api/books", { query: { limit: 500 } })
      .then((res) => {
        if (cancelled) return;
        const rows = res.data ?? [];
        const copies = rows.reduce((s, b) => s + (b.total ?? 0), 0);
        const available = rows.reduce((s, b) => s + (b.available ?? 0), 0);
        setStats({
          titles: res.meta?.total ?? rows.length,
          copies,
          available,
          issued: Math.max(0, copies - available),
        });
      })
      .catch(() => !cancelled && setStats({ titles: 0, copies: 0, available: 0, issued: 0 }));
    return () => {
      cancelled = true;
    };
  }, [libInTier]);

  if (!libInTier) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted">
          Your current plan doesn&apos;t include the Library module. Ask your administrator to upgrade to unlock it.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats === null ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <StatCard icon={Library} label="Titles" value={String(stats.titles)} tone="bg-primary-soft text-primary-text" />
            <StatCard icon={Boxes} label="Total copies" value={String(stats.copies)} tone="bg-info-soft text-info-text" />
            <StatCard icon={BookCheck} label="Available" value={String(stats.available)} tone="bg-success-soft text-success" />
            <StatCard icon={BookOpen} label="Issued" value={String(stats.issued)} tone="bg-warning-soft text-warning-text" />
          </>
        )}
      </div>

      <Link href="/library" className="focus-ring group">
        <Card className="card-hover">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-white">
              <Library className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text">Manage the library catalog</p>
              <p className="truncate text-xs text-muted">Add, edit and organise books, authors and categories</p>
            </div>
            <ArrowRight className="size-4 text-subtle transition-colors group-hover:text-primary" />
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardContent className="py-4 text-xs text-muted">
          Issue / return (circulation) tracking is coming soon — for now the catalog and stock counts are
          managed from the library page.
        </CardContent>
      </Card>
    </div>
  );
}
