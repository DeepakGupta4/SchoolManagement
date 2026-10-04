"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  ConfirmDialog,
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
import { sortClasses } from "@/lib/classOrder";
import { TODAY_ISO } from "@/lib/dates";
import { useClassOptions } from "@/hooks/useClassOptions";
import {
  fetchAllStudents,
  promoteStudents,
  type PromotionDecision,
} from "@/lib/api/students";
import type { Student } from "@/types/student";

const PAGE_SIZE = 10;

/** Result derived from marks. "not-assessed" = no exams entered yet (perf 0). */
type ResultState = "pass" | "fail" | "not-assessed";

/** A promotion row projected from a real student record. */
type Row = {
  id: string;
  roll: number;
  name: string;
  currentClass: string;
  section: string;
  attendance: number;
  average: number;
  /** false when no exam marks exist yet — average must not read as a real score. */
  assessed: boolean;
  result: ResultState;
};

type Decision = "promote" | "retain" | "graduate";

const DECISIONS: { value: Decision; label: string; icon: typeof ArrowUpCircle }[] = [
  { value: "promote", label: "Promote", icon: ArrowUpCircle },
  { value: "retain", label: "Retain", icon: RotateCcw },
  { value: "graduate", label: "Graduate", icon: GraduationCap },
];

/**
 * Academic-session options derived from today (local), so the list never goes
 * stale. Value is the "to" session; the batch promotes INTO it. The session is
 * sent to the server, which records it per student to make re-applying a no-op.
 */
const short = (n: number) => String(n).slice(2);
const SESSION_BASE_YEAR = Number(TODAY_ISO.slice(0, 4));
const SESSION_OPTIONS = [0, 1].map((off) => {
  const to = SESSION_BASE_YEAR + off;
  return { value: `${to}-${short(to + 1)}`, label: `${to - 1}-${short(to)} → ${to}-${short(to + 1)}` };
});

/**
 * Where a "promote" sends a student. "next" -> a real next class, "final" -> the
 * last class (graduates), "unknown" -> the class isn't in the configured list so
 * no target can be resolved (never silently graduate these).
 */
function promotionTarget(
  currentClass: string,
  ordered: string[]
): { next: string | null; status: "next" | "final" | "unknown" } {
  const i = ordered.indexOf(currentClass);
  if (i < 0) return { next: null, status: "unknown" };
  if (i === ordered.length - 1) return { next: null, status: "final" };
  return { next: ordered[i + 1], status: "next" };
}

function toRow(s: Student): Row {
  const average = Math.round(s.performancePercent ?? 0);
  // perf 0 = NOT ASSESSED (no exams) — never treat as a real failing score.
  const assessed = (s.performancePercent ?? 0) > 0;
  return {
    id: s.id,
    roll: Number(s.rollNo) || 0,
    name: `${s.firstName} ${s.lastName}`.trim(),
    currentClass: s.className,
    section: s.section,
    attendance: Math.round(s.attendancePercent ?? 0),
    average,
    assessed,
    result: !assessed ? "not-assessed" : average >= 40 ? "pass" : "fail",
  };
}

/**
 * Default decision: final class -> graduate; a genuine fail -> retain; everyone
 * else (pass OR not-yet-assessed) -> promote. A class not in the configured list
 * defaults to retain (never auto-graduate an unresolved class).
 */
function defaultDecision(r: Row, ordered: string[]): Decision {
  const { status } = promotionTarget(r.currentClass, ordered);
  if (status === "unknown") return "retain";
  if (status === "final") return "graduate";
  return r.result === "fail" ? "retain" : "promote";
}

function computeDefaults(rows: Row[], ordered: string[]): Record<string, Decision> {
  return Object.fromEntries(rows.map((r) => [r.id, defaultDecision(r, ordered)]));
}

/** Keyboard-accessible decision picker — roving tabindex + arrow keys per the ARIA radiogroup pattern. */
function DecisionRadioGroup({
  value,
  onChange,
  name,
  disabled,
}: {
  value: Decision;
  onChange: (d: Decision) => void;
  name: string;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, DECISIONS.findIndex((d) => d.value === value));

  const select = (target: number) => {
    const n = (target + DECISIONS.length) % DECISIONS.length;
    onChange(DECISIONS[n].value);
    refs.current[n]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        select(idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        select(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        select(0);
        break;
      case "End":
        e.preventDefault();
        select(DECISIONS.length - 1);
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={`Promotion decision for ${name}`}
      onKeyDown={onKeyDown}
      className="inline-flex gap-1 rounded-md bg-surface-sunken p-1"
    >
      {DECISIONS.map(({ value: v, label, icon: Icon }, i) => {
        const active = value === v;
        return (
          <button
            key={v}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(v)}
            className={cn(
              "focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? v === "promote"
                  ? "bg-success-soft text-success-text shadow-sm"
                  : v === "retain"
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
  );
}

export default function PromotionsPage() {
  const { toast } = useToast();
  const { classOptions, classNames, defaultClass } = useClassOptions();
  const ordered = useMemo(() => sortClasses(classNames), [classNames]);
  const classesReady = ordered.length > 0;

  const [session, setSession] = useState(SESSION_OPTIONS[0].value);
  const [currentClass, setCurrentClass] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  // Which session was last committed — compared during render rather than
  // cleared from an effect when the session changes.
  const [appliedSession, setAppliedSession] = useState<string | null>(null);

  // Default the class filter to the lowest class once the roster's classes
  // resolve, so the batch opens focused on one class (the safe way to promote)
  // rather than the whole school. Runs once and steps aside if the user picks.
  const defaultedClass = useRef(false);
  useEffect(() => {
    if (defaultedClass.current || currentClass || !defaultClass) return;
    defaultedClass.current = true;
    const t = setTimeout(() => setCurrentClass(defaultClass), 0);
    return () => clearTimeout(t);
  }, [currentClass, defaultClass]);

  // Load the COMPLETE active roster for the selected class (all active students
  // when unfiltered) — a promotion batch must not be a capped page.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError(false);
    fetchAllStudents({ className: currentClass || undefined, status: "active" })
      .then((students) => {
        if (cancelled) return;
        const next = students.map(toRow).sort((a, b) => a.roll - b.roll);
        setRows(next);
        setDecisions(computeDefaults(next, ordered));
        setAppliedSession(null);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentClass, ordered, reloadKey]);

  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const setDecision = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    setAppliedSession(null);
  };

  const query = search.trim().toLowerCase();
  const sessionLabel = SESSION_OPTIONS.find((o) => o.value === session)?.label ?? session;
  const scopeLabel = currentClass || "all classes";

  // The loaded roster is the batch being processed — every count and the Apply
  // action are scoped to it (not the search-filtered view).
  const batch = rows;

  const filtered = useMemo(
    () =>
      batch.filter(
        (s) => !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
      ),
    [batch, query]
  );

  // Clamp during render — a shrunk list (search, or post-apply reload) must not
  // strand the user on an empty page.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const countOf = (d: Decision) => batch.filter((s) => (decisions[s.id] ?? "promote") === d).length;
  const promoting = countOf("promote");
  const retaining = countOf("retain");
  const graduating = countOf("graduate");

  // What will ACTUALLY happen on apply (a promote on the final class graduates; an
  // unresolved class is skipped) — used for the confirmation summary.
  const effective = useMemo(() => {
    let promote = 0;
    let retain = 0;
    let graduate = 0;
    let review = 0;
    for (const s of batch) {
      const action = decisions[s.id] ?? defaultDecision(s, ordered);
      const { status } = promotionTarget(s.currentClass, ordered);
      if (action === "promote") {
        if (status === "unknown") review += 1;
        else if (status === "final") graduate += 1;
        else promote += 1;
      } else if (action === "graduate") {
        graduate += 1;
      } else {
        retain += 1;
      }
    }
    return { promote, retain, graduate, review };
  }, [batch, decisions, ordered]);

  const bulkPromote = () => {
    // Acts on the rows currently in view (the search-filtered "listed" set).
    setDecisions((prev) => {
      const next = { ...prev };
      filtered.forEach((s) => {
        next[s.id] = promotionTarget(s.currentClass, ordered).status === "final" ? "graduate" : "promote";
      });
      return next;
    });
    setAppliedSession(null);
    toast({
      title: "Marked for promotion",
      description: `${filtered.length} listed student(s) set to Promote/Graduate.`,
    });
  };

  const resetDecisions = () => {
    setDecisions(computeDefaults(rows, ordered));
    setAppliedSession(null);
    toast({ title: "Decisions reset", description: "Every row is back to its default." });
  };

  const requestApply = () => {
    if (!classesReady) {
      toast({ title: "Classes still loading", description: "Wait for the class list, then apply.", variant: "warning" });
      return;
    }
    if (batch.length === 0) {
      toast({ title: "Nothing to apply", description: "No students are listed for this batch.", variant: "warning" });
      return;
    }
    setConfirmOpen(true);
  };

  const doApply = async () => {
    setConfirmOpen(false);

    const promotions: PromotionDecision[] = [];
    let skippedReview = 0;
    for (const s of batch) {
      const action = decisions[s.id] ?? defaultDecision(s, ordered);
      const { next, status } = promotionTarget(s.currentClass, ordered);
      if (action === "promote") {
        if (status === "unknown") {
          skippedReview += 1; // can't resolve a target class — don't send it
          continue;
        }
        if (status === "final" || next === null) {
          promotions.push({ studentId: s.id, action: "graduate" });
        } else {
          promotions.push({ studentId: s.id, action: "promote", toClass: next });
        }
      } else {
        promotions.push({ studentId: s.id, action });
      }
    }

    if (promotions.length === 0) {
      toast({
        title: "Nothing to apply",
        description: skippedReview
          ? "Every row's class is missing from Classes & Sections — fix that first."
          : "No students are listed for this batch.",
        variant: "warning",
      });
      return;
    }

    setApplying(true);
    let result;
    try {
      result = await promoteStudents(promotions, session);
    } catch (e) {
      toast({
        title: "Could not apply promotions",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
      setApplying(false);
      return;
    }

    setAppliedSession(session);
    const skippedTotal = (result.skipped ?? 0) + skippedReview;
    toast({
      title: `Promotions applied — ${sessionLabel}`,
      description: `${result.promoted} promoted, ${result.retained} retained, ${result.graduated} graduated${
        skippedTotal ? `, ${skippedTotal} skipped` : ""
      }.`,
    });

    // Refetch in its OWN try/catch so a refresh hiccup isn't reported as an apply
    // failure (which would tempt a re-apply).
    try {
      const students = await fetchAllStudents({ className: currentClass || undefined, status: "active" });
      const next = students.map(toRow).sort((a, b) => a.roll - b.roll);
      setRows(next);
      setDecisions(computeDefaults(next, ordered));
      setPage(1);
    } catch {
      toast({
        title: "Applied — refresh to see updated classes",
        description: "The promotion went through; reload the page to see the new roster.",
        variant: "warning",
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
      render: (s) => (
        <span className="whitespace-nowrap">
          <Badge variant="info">{s.currentClass}</Badge>
          <span className="ml-1 text-xs text-subtle">· {s.section}</span>
        </span>
      ),
    },
    {
      key: "attendance",
      header: "Attendance",
      sortable: true,
      align: "right",
      render: (s) => (
        <span className={cn("font-medium", s.attendance >= 75 ? "text-text" : "text-danger-text")}>
          {s.attendance}%
        </span>
      ),
    },
    {
      key: "average",
      header: "Average",
      sortable: true,
      align: "right",
      render: (s) =>
        s.assessed ? (
          <span
            className={cn(
              "font-semibold",
              s.average >= 75 ? "text-success" : s.average >= 50 ? "text-warning" : "text-danger-text"
            )}
          >
            {s.average}%
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "result",
      header: "Result",
      sortable: true,
      render: (s) =>
        s.result === "not-assessed" ? (
          <Badge variant="outline">Not assessed</Badge>
        ) : (
          <Badge variant={s.result === "pass" ? "success" : "danger"} className="capitalize">
            {s.result}
          </Badge>
        ),
    },
    {
      key: "target",
      header: "Outcome",
      render: (s) => {
        const action = decisions[s.id] ?? defaultDecision(s, ordered);
        const { next, status } = promotionTarget(s.currentClass, ordered);
        if (action === "retain") return <span className="text-muted">Stays in {s.currentClass}</span>;
        if (action === "graduate") return <span className="font-medium text-info-text">Graduating</span>;
        // promote
        if (status === "unknown") return <span className="font-medium text-danger-text">Class not configured</span>;
        if (status === "final" || next === null) return <span className="font-medium text-info-text">Graduating</span>;
        return (
          <span className="whitespace-nowrap text-sm text-text">
            → <span className="font-medium">{next}</span>
          </span>
        );
      },
    },
    {
      key: "decision",
      header: "Decision",
      render: (s) => (
        <DecisionRadioGroup
          name={s.name}
          value={decisions[s.id] ?? defaultDecision(s, ordered)}
          onChange={(d) => setDecision(s.id, d)}
          disabled={applying}
        />
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
            <Button variant="secondary" onClick={bulkPromote} disabled={loading || applying || filtered.length === 0}>
              <ArrowUpCircle className="size-4" />
              Promote All Listed
            </Button>
            <Button onClick={requestApply} disabled={loading || applying || !classesReady || batch.length === 0}>
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
            {appliedSession === session && <Badge variant="success">Applied</Badge>}
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

      {loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger-text">Couldn&apos;t load the roster.</p>
            <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
              <RotateCcw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Table
            columns={columns}
            rows={paged}
            rowKey={(s) => s.id}
            loading={loading}
            rowClassName={(s) => (decisions[s.id] === "retain" ? "bg-warning-soft" : undefined)}
            emptyTitle="No students found"
            emptyDescription={
              query
                ? "No students match your search."
                : currentClass
                  ? `No active students in ${currentClass}.`
                  : "No active students to promote."
            }
          />

          {!loading && filtered.length > 0 && (
            <Pagination page={safePage} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Apply promotions?"
        description={
          `For ${sessionLabel} · ${scopeLabel}: ${effective.promote} will move up a class, ` +
          `${effective.retain} stay, ${effective.graduate} graduate (become alumni)` +
          `${effective.review ? `, ${effective.review} skipped (class not configured)` : ""}. ` +
          `This applies to all ${batch.length} student(s) in the batch and cannot be undone.`
        }
        confirmLabel="Apply promotions"
        loading={applying}
        onConfirm={doApply}
      />
    </div>
  );
}
