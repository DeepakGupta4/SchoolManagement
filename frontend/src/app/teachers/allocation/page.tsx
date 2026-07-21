"use client";

import { useMemo, useState } from "react";
import {
  CalendarRange,
  Download,
  GraduationCap,
  Plus,
  Search,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  Tooltip,
  type Column,
} from "@/components/ui";

const PAGE_SIZE = 10;

/** Periods a full-time teacher is contracted for in a week. */
const MAX_PERIODS = 36;

const allocations = [
  { id: "AL01", teacher: "Dr. Priya Sharma",  empId: "TCH-1041", dept: "Mathematics",      subject: "Mathematics",      classes: ["X-A", "X-B", "XII-A"],   periods: 32, labs: 0, room: "R-204" },
  { id: "AL02", teacher: "Mr. Rahul Verma",   empId: "TCH-1052", dept: "Science",          subject: "Physics",          classes: ["XI-A", "XII-A"],         periods: 28, labs: 6, room: "Lab-1" },
  { id: "AL03", teacher: "Ms. Anita Patel",   empId: "TCH-1063", dept: "English",          subject: "English",          classes: ["VI-A", "VII-B", "VIII-A"], periods: 30, labs: 0, room: "R-108" },
  { id: "AL04", teacher: "Mr. Suresh Kumar",  empId: "TCH-1074", dept: "Social Science",   subject: "History",          classes: ["IX-A", "X-C"],           periods: 22, labs: 0, room: "R-112" },
  { id: "AL05", teacher: "Ms. Kavita Singh",  empId: "TCH-1085", dept: "Science",          subject: "Chemistry",        classes: ["XI-B", "XII-B"],         periods: 34, labs: 8, room: "Lab-2" },
  { id: "AL06", teacher: "Mr. Amit Joshi",    empId: "TCH-1096", dept: "Computer Science", subject: "Computer Science", classes: ["VIII-B", "IX-B", "X-A"], periods: 26, labs: 10, room: "IT-1" },
  { id: "AL07", teacher: "Ms. Deepa Nair",    empId: "TCH-1107", dept: "Science",          subject: "Biology",          classes: ["XI-A", "XII-B"],         periods: 24, labs: 6, room: "Lab-3" },
  { id: "AL08", teacher: "Mr. Vikram Gupta",  empId: "TCH-1118", dept: "Physical Education", subject: "Phy. Education", classes: ["VI-A", "VII-A", "VIII-A", "IX-A"], periods: 18, labs: 0, room: "Ground" },
  { id: "AL09", teacher: "Ms. Meenakshi Rao", empId: "TCH-1129", dept: "Hindi",            subject: "Hindi",            classes: ["VI-B", "VII-A"],         periods: 20, labs: 0, room: "R-105" },
  { id: "AL10", teacher: "Ms. Ritu Bansal",   empId: "TCH-1130", dept: "Commerce",         subject: "Accountancy",      classes: ["XI-C", "XII-C"],         periods: 30, labs: 0, room: "R-301" },
  { id: "AL11", teacher: "Mr. Kartik Iyer",   empId: "TCH-1141", dept: "Music & Dance",    subject: "Music",            classes: ["VI-A", "VII-B"],         periods: 12, labs: 0, room: "Studio" },
  { id: "AL12", teacher: "Ms. Shalini Desai", empId: "TCH-1152", dept: "Fine Arts",        subject: "Drawing",          classes: ["VI-B", "VIII-B"],        periods: 14, labs: 0, room: "Art-1" },
  { id: "AL13", teacher: "Ms. Lata Trivedi",  empId: "TCH-1163", dept: "Sanskrit",         subject: "Sanskrit",         classes: ["VII-A", "VIII-A"],       periods: 16, labs: 0, room: "R-110" },
  { id: "AL14", teacher: "Mr. Naveen Chawla", empId: "TCH-1174", dept: "Vocational Studies", subject: "Electronics",    classes: ["IX-B", "X-B"],           periods: 10, labs: 4, room: "Voc-1" },
  { id: "AL15", teacher: "Ms. Farida Sheikh", empId: "TCH-1185", dept: "Special Education", subject: "Remedial",        classes: ["VI-A", "VII-A"],         periods: 15, labs: 0, room: "R-002" },
  { id: "AL16", teacher: "Ms. Elena D'Souza", empId: "TCH-1196", dept: "Foreign Languages", subject: "French",          classes: ["XI-A", "XII-A"],         periods: 12, labs: 0, room: "R-306" },
  { id: "AL17", teacher: "Mr. Rakesh Yadav",  empId: "TCH-1207", dept: "Mathematics",      subject: "Mathematics",      classes: ["VIII-A", "IX-A", "IX-B"], periods: 35, labs: 0, room: "R-206" },
  { id: "AL18", teacher: "Ms. Sneha Kulkarni", empId: "TCH-1218", dept: "English",         subject: "Literature",       classes: ["XI-B", "XII-B"],         periods: 21, labs: 0, room: "R-115" },
];

type Allocation = (typeof allocations)[number];

const DEPT_OPTIONS = [...new Set(allocations.map((a) => a.dept))]
  .sort()
  .map((d) => ({ label: d, value: d }));

const CLASS_OPTIONS = [...new Set(allocations.flatMap((a) => a.classes))]
  .sort()
  .map((c) => ({ label: `Class ${c}`, value: c }));

/** Under 50% is under-used, over 90% is an overload risk. */
function loadBand(pct: number) {
  if (pct >= 90) return { label: "Overloaded", variant: "danger" as const, fill: "bg-danger" };
  if (pct >= 70) return { label: "Optimal", variant: "success" as const, fill: "bg-success" };
  if (pct >= 45) return { label: "Moderate", variant: "info" as const, fill: "bg-info" };
  return { label: "Under-used", variant: "warning" as const, fill: "bg-warning" };
}

function WorkloadBar({ periods }: { periods: number }) {
  const pct = Math.min(100, Math.round((periods / MAX_PERIODS) * 100));
  const band = loadBand(pct);

  return (
    <Tooltip content={`${periods} of ${MAX_PERIODS} periods — ${band.label}`} side="top">
      <div className="min-w-36">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-text">{periods} p/w</span>
          <span className="text-subtle">{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div className={`h-full rounded-full ${band.fill}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Tooltip>
  );
}

export default function AllocationPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [klass, setKlass] = useState("");
  const [load, setLoad] = useState("");
  const [page, setPage] = useState(1);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allocations.filter((a) => {
      const matchesSearch =
        !q ||
        a.teacher.toLowerCase().includes(q) ||
        a.empId.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q) ||
        a.classes.some((c) => c.toLowerCase().includes(q));
      const band = loadBand(Math.round((a.periods / MAX_PERIODS) * 100)).label;
      return (
        matchesSearch &&
        (!dept || a.dept === dept) &&
        (!klass || a.classes.includes(klass)) &&
        (!load || band === load)
      );
    });
  }, [search, dept, klass, load]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const stats = useMemo(() => {
    const totalPeriods = allocations.reduce((sum, a) => sum + a.periods, 0);
    const overloaded = allocations.filter((a) => a.periods / MAX_PERIODS >= 0.9).length;
    const sections = new Set(allocations.flatMap((a) => a.classes)).size;
    return {
      teachers: allocations.length,
      totalPeriods,
      avgLoad: Math.round(totalPeriods / allocations.length),
      overloaded,
      sections,
    };
  }, []);

  const columns: Column<Allocation>[] = [
    {
      key: "teacher",
      header: "Teacher",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.teacher} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{a.teacher}</p>
            <p className="truncate text-xs text-subtle">{a.empId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (a) => (
        <div className="min-w-0">
          <Badge variant="info">{a.subject}</Badge>
          <p className="mt-1 truncate text-xs text-subtle">{a.dept}</p>
        </div>
      ),
    },
    {
      key: "classes",
      header: "Classes",
      render: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.classes.map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-sm border border-border bg-surface-sunken px-1.5 py-0.5 text-xs font-medium text-muted"
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.room}</span>,
    },
    {
      key: "labs",
      header: "Lab",
      sortable: true,
      align: "right",
      render: (a) =>
        a.labs > 0 ? (
          <span className="whitespace-nowrap text-muted">{a.labs} p/w</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "periods",
      header: "Weekly workload",
      sortable: true,
      render: (a) => <WorkloadBar periods={a.periods} />,
    },
    {
      key: "band",
      header: "Load",
      sortable: true,
      sortValue: (a) => a.periods,
      render: (a) => {
        const band = loadBand(Math.round((a.periods / MAX_PERIODS) * 100));
        return <Badge variant={band.variant}>{band.label}</Badge>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Subject allocation"
        description="Teacher × class × subject matrix with weekly period load and overload flags."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export matrix
            </Button>
            <Button>
              <Plus className="size-4" />
              Allocate subject
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Teachers allocated" value={stats.teachers} icon={Users} tone="indigo" />
        <StatCard label="Periods / week" value={stats.totalPeriods} icon={CalendarRange} tone="cyan" />
        <StatCard
          label="Average load"
          value={stats.avgLoad}
          suffix=" p/w"
          icon={GraduationCap}
          tone="emerald"
          sub={`Cap is ${MAX_PERIODS} periods`}
        />
        <StatCard label="Overloaded" value={stats.overloaded} icon={TriangleAlert} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by teacher, employee ID, subject or class…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search allocations"
          />
        </div>
        <div className="w-52">
          <Select
            value={dept}
            onChange={(e) => applyFilter(setDept)(e.target.value)}
            placeholder="All departments"
            options={DEPT_OPTIONS}
            aria-label="Filter by department"
          />
        </div>
        <div className="w-40">
          <Select
            value={klass}
            onChange={(e) => applyFilter(setKlass)(e.target.value)}
            placeholder="All classes"
            options={CLASS_OPTIONS}
            aria-label="Filter by class"
          />
        </div>
        <div className="w-44">
          <Select
            value={load}
            onChange={(e) => applyFilter(setLoad)(e.target.value)}
            placeholder="All loads"
            options={[
              { label: "Overloaded", value: "Overloaded" },
              { label: "Optimal", value: "Optimal" },
              { label: "Moderate", value: "Moderate" },
              { label: "Under-used", value: "Under-used" },
            ]}
            aria-label="Filter by workload band"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(a) => a.id}
        rowClassName={(a) => (a.periods / MAX_PERIODS >= 0.9 ? "bg-danger-soft" : undefined)}
        emptyTitle="No allocations found"
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
