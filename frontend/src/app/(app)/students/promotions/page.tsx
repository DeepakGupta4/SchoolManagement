"use client";

import React, { useState } from "react";
import {
  ArrowUpCircle,
  CheckCircle2,
  GraduationCap,
  PauseCircle,
  RotateCcw,
  Search,
  Users,
  XCircle,
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

const PAGE_SIZE = 10;

const students = [
  { id: "STU-0901", roll: 1,  name: "Aarav Sharma",      currentClass: "9-A",  section: "A", attendance: 94, average: 82, result: "pass" },
  { id: "STU-0902", roll: 2,  name: "Diya Nair",         currentClass: "9-A",  section: "A", attendance: 91, average: 88, result: "pass" },
  { id: "STU-0903", roll: 3,  name: "Kabir Malhotra",    currentClass: "9-A",  section: "A", attendance: 68, average: 41, result: "fail" },
  { id: "STU-0904", roll: 4,  name: "Ananya Iyer",       currentClass: "9-A",  section: "A", attendance: 97, average: 91, result: "pass" },
  { id: "STU-0905", roll: 5,  name: "Vivaan Reddy",      currentClass: "9-A",  section: "A", attendance: 72, average: 55, result: "pass" },
  { id: "STU-0906", roll: 6,  name: "Ishita Banerjee",   currentClass: "9-A",  section: "A", attendance: 88, average: 76, result: "pass" },
  { id: "STU-0907", roll: 7,  name: "Reyansh Gupta",     currentClass: "9-A",  section: "A", attendance: 61, average: 38, result: "fail" },
  { id: "STU-0908", roll: 8,  name: "Saanvi Patil",      currentClass: "9-A",  section: "A", attendance: 93, average: 84, result: "pass" },
  { id: "STU-0909", roll: 9,  name: "Arjun Chauhan",     currentClass: "9-A",  section: "A", attendance: 79, average: 63, result: "pass" },
  { id: "STU-0910", roll: 10, name: "Myra Joshi",        currentClass: "9-A",  section: "A", attendance: 96, average: 89, result: "pass" },
  { id: "STU-0911", roll: 11, name: "Advik Deshmukh",    currentClass: "9-B",  section: "B", attendance: 84, average: 71, result: "pass" },
  { id: "STU-0912", roll: 12, name: "Kiara Menon",       currentClass: "9-B",  section: "B", attendance: 58, average: 34, result: "fail" },
  { id: "STU-0913", roll: 13, name: "Atharv Rathore",    currentClass: "9-B",  section: "B", attendance: 90, average: 79, result: "pass" },
  { id: "STU-0914", roll: 14, name: "Aadhya Kulkarni",   currentClass: "9-B",  section: "B", attendance: 95, average: 93, result: "pass" },
  { id: "STU-0915", roll: 15, name: "Vihaan Saxena",     currentClass: "9-B",  section: "B", attendance: 74, average: 58, result: "pass" },
  { id: "STU-0916", roll: 16, name: "Anika Bhatt",       currentClass: "9-B",  section: "B", attendance: 87, average: 80, result: "pass" },
  { id: "STU-0917", roll: 17, name: "Shaurya Pillai",    currentClass: "9-B",  section: "B", attendance: 66, average: 45, result: "fail" },
  { id: "STU-0918", roll: 18, name: "Navya Choudhary",   currentClass: "9-B",  section: "B", attendance: 92, average: 86, result: "pass" },
];

type Student = (typeof students)[number];
type Decision = "promote" | "hold" | "detain";

const DECISIONS: { value: Decision; label: string; icon: typeof ArrowUpCircle }[] = [
  { value: "promote", label: "Promote", icon: ArrowUpCircle },
  { value: "hold", label: "Hold", icon: PauseCircle },
  { value: "detain", label: "Detain", icon: XCircle },
];

const SESSION_OPTIONS = [
  { label: "2025-26 → 2026-27", value: "2026-27" },
  { label: "2024-25 → 2025-26", value: "2025-26" },
  { label: "2023-24 → 2024-25", value: "2024-25" },
];

const CLASS_OPTIONS = [
  { label: "Class 9 - A", value: "9-A" },
  { label: "Class 9 - B", value: "9-B" },
];

/** Default decision follows the exam result — failures start on Detain. */
function defaultDecision(s: Student): Decision {
  return s.result === "fail" ? "detain" : "promote";
}

const initialDecisions: Record<string, Decision> = Object.fromEntries(
  students.map((s) => [s.id, defaultDecision(s)])
);

export default function PromotionsPage() {
  const { toast } = useToast();

  const [session, setSession] = useState("2026-27");
  const [currentClass, setCurrentClass] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [decisions, setDecisions] = useState<Record<string, Decision>>(initialDecisions);

  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const setDecision = (id: string, decision: Decision) =>
    setDecisions((prev) => ({ ...prev, [id]: decision }));

  const query = search.trim().toLowerCase();
  const filtered = students.filter((s) => {
    const matchSearch =
      !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query);
    return matchSearch && (!currentClass || s.currentClass === currentClass);
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const countOf = (d: Decision) => students.filter((s) => decisions[s.id] === d).length;
  const promoting = countOf("promote");
  const holding = countOf("hold");
  const detaining = countOf("detain");

  const bulkPromote = () => {
    // Only the rows currently in view are affected — that is what the operator sees.
    setDecisions((prev) => {
      const next = { ...prev };
      filtered.forEach((s) => {
        next[s.id] = "promote";
      });
      return next;
    });
    toast({
      title: "Marked for promotion",
      description: `${filtered.length} student(s) set to Promote.`,
    });
  };

  const resetDecisions = () => {
    setDecisions(initialDecisions);
    toast({ title: "Decisions reset", description: "Every row is back to its result default." });
  };

  const columns: Column<Student>[] = [
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
                      : value === "hold"
                        ? "bg-warning-soft text-warning-text shadow-sm"
                        : "bg-danger-soft text-danger-text shadow-sm"
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
        description="Review results and promote, hold or detain students for the next session."
        actions={
          <>
            <Button variant="outline" onClick={resetDecisions}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
            <Button onClick={bulkPromote}>
              <ArrowUpCircle className="size-4" />
              Promote All Listed
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students in Batch" value={students.length} icon={Users} tone="indigo" />
        <StatCard label="Marked Promote" value={promoting} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Marked Hold" value={holding} icon={PauseCircle} tone="amber" />
        <StatCard label="Marked Detain" value={detaining} icon={XCircle} tone="rose" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            <p className="text-sm font-medium text-text">Promotion Batch</p>
          </div>
          <Badge variant="outline">{filtered.length} listed</Badge>
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
            options={CLASS_OPTIONS}
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
              <Badge variant="warning">{holding} hold</Badge>
              <Badge variant="danger">{detaining} detain</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(s) => s.id}
        rowClassName={(s) => (decisions[s.id] === "detain" ? "bg-danger-soft" : undefined)}
        emptyTitle="No students found"
        emptyDescription="Try clearing your filters to see more results."
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}
