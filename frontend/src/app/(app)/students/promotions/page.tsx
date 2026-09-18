"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useClassOptions } from "@/hooks/useClassOptions";
import {
  listStudents,
  promoteStudents,
  type PromotionDecision,
} from "@/lib/api/students";
import type { Student } from "@/types/student";

const PAGE_SIZE = 10;

/** A promotion row projected from a real student record. */
type Row = {
  id: string;
  roll: number;
  name: string;
  currentClass: string;
  section: string;
  attendance: number;
  average: number;
  result: "pass" | "fail";
};

type Decision = "promote" | "retain" | "graduate";

const DECISIONS: { value: Decision; label: string; icon: typeof ArrowUpCircle }[] = [
  { value: "promote", label: "Promote", icon: ArrowUpCircle },
  { value: "retain", label: "Retain", icon: RotateCcw },
  { value: "graduate", label: "Graduate", icon: GraduationCap },
];

const SESSION_OPTIONS = [
  { label: "2025-26 → 2026-27", value: "2026-27" },
  { label: "2024-25 → 2025-26", value: "2025-26" },
  { label: "2023-24 → 2024-25", value: "2024-25" },
];

// Pre-primary grades rank below Class 1; everything else is ordered by its
// grade number so "next class" follows the real academic ladder regardless of
// the order classes were created in.
const GRADE_PREFIX: Record<string, number> = { nursery: -3, lkg: -2, ukg: -1, kg: -1, prep: -1 };

function classRank(name: string): number {
  const lower = name.toLowerCase().trim();
  for (const key of Object.keys(GRADE_PREFIX)) {
    if (lower.includes(key)) return GRADE_PREFIX[key];
  }
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 999;
}

/** Class names sorted into academic order (Nursery → Class 12). */
function sortClasses(names: string[]): string[] {
  return [...names].sort((a, b) => classRank(a) - classRank(b));
}

/** The class a student promotes into, or null for the final class. */
function nextClassOf(className: string, ordered: string[]): string | null {
  const i = ordered.indexOf(className);
  return i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : null;
}

/** A passing average is the derived exam outcome — real records carry marks, not a verdict. */
function resultOf(performancePercent: number): "pass" | "fail" {
  return performancePercent >= 40 ? "pass" : "fail";
}

function toRow(s: Student): Row {
  return {
    id: s.id,
    roll: Number(s.rollNo) || 0,
    name: `${s.firstName} ${s.lastName}`.trim(),
    currentClass: s.className,
    section: s.section,
    attendance: Math.round(s.attendancePercent ?? 0),
    average: Math.round(s.performancePercent ?? 0),
    result: resultOf(s.performancePercent ?? 0),
  };
}

/**
 * Default decision: students in the final class graduate, failures are held
 * back, everyone else is promoted to the next class.
 */
function defaultDecision(r: Row, ordered: string[]): Decision {
  if (nextClassOf(r.currentClass, ordered) === null) return "graduate";
  return r.result === "fail" ? "retain" : "promote";
}

function computeDefaults(rows: Row[], ordered: string[]): Record<string, Decision> {
  return Object.fromEntries(rows.map((r) => [r.id, defaultDecision(r, ordered)]));
}

export default function PromotionsPage() {
  const { toast } = useToast();
  const { classOptions, classNames } = useClassOptions();
  const ordered = useMemo(() => sortClasses(classNames), [classNames]);

  const [session, setSession] = useState("2026-27");
  const [currentClass, setCurrentClass] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  // Which session was last committed — compared during render rather than
  // cleared from an effect when the session changes.
  const [appliedSession, setAppliedSession] = useState<string | null>(null);

  // Load the real roster for the selected class (all classes when unfiltered).
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listStudents({ className: currentClass || undefined })
      .then((students) => {
        if (cancelled) return;
        const next = students.map(toRow).sort((a, b) => a.roll - b.roll);
        setRows(next);
        setDecisions(computeDefaults(next, ordered));
        setAppliedSession(null);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Could not load students", variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentClass, toast, ordered]);

  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const setDecision = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    setAppliedSession(null);
  };

  const query = search.trim().toLowerCase();
  const sessionLabel =
    SESSION_OPTIONS.find((o) => o.value === session)?.label ?? session;

  // The loaded roster is the batch being processed — every count and every
  // action on this page is scoped to it.
  const batch = rows;

  const filtered = useMemo(
    () =>
      batch.filter(
        (s) =>
          !query ||
          s.name.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      ),
    [batch, query]
  );

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const countOf = (d: Decision) => batch.filter((s) => decisions[s.id] === d).length;
  const promoting = countOf("promote");
  const retaining = countOf("retain");
  const graduating = countOf("graduate");

  const bulkPromote = () => {
    // Only the rows currently in view are affected — that is what the operator sees.
    setDecisions((prev) => {
      const next = { ...prev };
      filtered.forEach((s) => {
        next[s.id] = nextClassOf(s.currentClass, ordered) === null ? "graduate" : "promote";
      });
      return next;
    });
    setAppliedSession(null);
    toast({
      title: "Marked for promotion",
      description: `${filtered.length} student(s) set to Promote/Graduate.`,
    });
  };

  const resetDecisions = () => {
    setDecisions(computeDefaults(rows, ordered));
    setAppliedSession(null);
    toast({ title: "Decisions reset", description: "Every row is back to its default." });
  };

  const applyPromotions = async () => {
    if (batch.length === 0) {
      toast({
        title: "Nothing to apply",
        description: "No students are listed for this batch.",
        variant: "warning",
      });
      return;
    }

    const promotions: PromotionDecision[] = batch.map((s) => {
      const action = decisions[s.id] ?? defaultDecision(s, ordered);
      if (action === "promote") {
        const toClass = nextClassOf(s.currentClass, ordered);
        // A "promote" on the final class has nowhere to go — graduate instead.
        return toClass ? { studentId: s.id, action, toClass } : { studentId: s.id, action: "graduate" };
      }
      return { studentId: s.id, action };
    });

    setApplying(true);
    try {
      const result = await promoteStudents(promotions);
      setAppliedSession(session);
      toast({
        title: `Promotions applied — ${sessionLabel}`,
        description: `${result.promoted} promoted, ${result.retained} retained, ${result.graduated} graduated.`,
      });
      // Refetch so the roster reflects the new classes / statuses.
      const students = await listStudents({ className: currentClass || undefined });
      const next = students.map(toRow).sort((a, b) => a.roll - b.roll);
      setRows(next);
      setDecisions(computeDefaults(next, ordered));
    } catch (e) {
      toast({
        title: "Could not apply promotions",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setApplying(false);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "roll",
      header: "Roll",
      sortable: true,
      align: "right",
      render: (s) => <span className="text-muted">{s.roll}</span>,
    },
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-subtle">{s.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "currentClass",
      header: "Current",
      sortable: true,
      render: (s) => <Badge variant="info">{s.currentClass}</Badge>,
    },
    {
      key: "attendance",
      header: "Attendance",
      sortable: true,
      align: "right",
      render: (s) => (
        <span className={cn("font-medium", s.attendance >= 75 ? "text-text" : "text-danger")}>
          {s.attendance}%
        </span>
      ),
    },
    {
      key: "average",
      header: "Average",
      sortable: true,
      align: "right",
      render: (s) => (
        <span
          className={cn(
            "font-semibold",
            s.average >= 75 ? "text-success" : s.average >= 50 ? "text-warning" : "text-danger"
          )}
        >
          {s.average}%
        </span>
      ),
    },
    {
      key: "result",
      header: "Result",
      sortable: true,
      render: (s) => (
        <Badge variant={s.result === "pass" ? "success" : "danger"} className="capitalize">
          {s.result}
        </Badge>
      ),
    },
    {
      key: "decision",
      header: "Decision",
      render: (s) => (
        <div
          role="radiogroup"
          aria-label={`Promotion decision for ${s.name}`}
          className="inline-flex gap-1 rounded-md bg-surface-sunken p-1"
        >
          {DECISIONS.map(({ value, label, icon: Icon }) => {
            const active = decisions[s.id] === value;
            return (
              <button
                key={value}
                role="radio"
                aria-checked={active}
                onClick={() => setDecision(s.id, value)}
                className={cn(
                  "focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? value === "promote"
                      ? "bg-success-soft text-success-text shadow-sm"
                      : value === "retain"
                        ? "bg-warning-soft text-warning-text shadow-sm"
                        : "bg-info-soft text-info-text shadow-sm"
                    : "text-muted hover:text-text"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Class Promotion"
        description="Review results and promote, retain or graduate students for the next session."
        actions={
          <>
            <Button variant="outline" onClick={resetDecisions} disabled={loading || applying}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
            <Button variant="secondary" onClick={bulkPromote} disabled={loading || applying}>
              <ArrowUpCircle className="size-4" />
              Promote All Listed
            </Button>
            <Button onClick={applyPromotions} disabled={loading || applying}>
              {applying ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Apply promotions
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students in Batch" value={batch.length} icon={Users} tone="indigo" />
        <StatCard label="Marked Promote" value={promoting} icon={ArrowUpCircle} tone="emerald" />
        <StatCard label="Marked Retain" value={retaining} icon={RotateCcw} tone="amber" />
        <StatCard label="Marked Graduate" value={graduating} icon={GraduationCap} tone="violet" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            <p className="text-sm font-medium text-text">Promotion Batch — {sessionLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {appliedSession === session && (
              <Badge variant="success">Applied</Badge>
            )}
            <Badge variant="outline">{filtered.length} listed</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Academic session"
            value={session}
            onChange={(e) => applyFilter(setSession)(e.target.value)}
            options={SESSION_OPTIONS}
          />
          <Select
            label="Current class"
            value={currentClass}
            onChange={(e) => applyFilter(setCurrentClass)(e.target.value)}
            placeholder="All classes"
            options={classOptions}
          />
          <Input
            label="Search"
            type="search"
            placeholder="Student name or ID…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
          />
          <div className="flex flex-col justify-end gap-1.5">
            <p className="text-xs font-medium text-muted">Summary</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="success">{promoting} promote</Badge>
              <Badge variant="warning">{retaining} retain</Badge>
              <Badge variant="info">{graduating} graduate</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid place-items-center py-16 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            rows={paged}
            rowKey={(s) => s.id}
            rowClassName={(s) => (decisions[s.id] === "retain" ? "bg-warning-soft" : undefined)}
            emptyTitle="No students found"
            emptyDescription="Try clearing your filters to see more results."
          />

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
