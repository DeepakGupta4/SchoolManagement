"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Download,
  IndianRupee,
  Plus,
  Search,
  Users,
  Wallet,
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
  type Column,
} from "@/components/ui";

const PAGE_SIZE = 8;

const departments = [
  { id: "DP01", name: "Mathematics",       code: "MATH", hod: "Dr. Priya Sharma",    block: "Science Block",   teachers: 9,  subjects: ["Algebra", "Geometry", "Calculus"],        budget: 480000,  spent: 402000, status: "active"  },
  { id: "DP02", name: "Science",           code: "SCI",  hod: "Mr. Rahul Verma",     block: "Science Block",   teachers: 12, subjects: ["Physics", "Chemistry", "Biology"],        budget: 725000,  spent: 690000, status: "active"  },
  { id: "DP03", name: "English",           code: "ENG",  hod: "Ms. Anita Patel",     block: "Main Block",      teachers: 8,  subjects: ["Literature", "Grammar", "Composition"],   budget: 310000,  spent: 218000, status: "active"  },
  { id: "DP04", name: "Social Science",    code: "SST",  hod: "Mr. Suresh Kumar",    block: "Main Block",      teachers: 7,  subjects: ["History", "Civics", "Geography"],         budget: 285000,  spent: 190000, status: "active"  },
  { id: "DP05", name: "Hindi",             code: "HIN",  hod: "Ms. Meenakshi Rao",   block: "Main Block",      teachers: 6,  subjects: ["Vyakaran", "Gadya", "Padya"],             budget: 240000,  spent: 176000, status: "active"  },
  { id: "DP06", name: "Computer Science",  code: "CS",   hod: "Mr. Amit Joshi",      block: "IT Wing",         teachers: 5,  subjects: ["Python", "Java", "Web Design"],           budget: 620000,  spent: 585000, status: "active"  },
  { id: "DP07", name: "Commerce",          code: "COM",  hod: "Ms. Ritu Bansal",     block: "Senior Wing",     teachers: 6,  subjects: ["Accountancy", "Business Studies"],        budget: 295000,  spent: 121000, status: "active"  },
  { id: "DP08", name: "Physical Education",code: "PE",   hod: "Mr. Vikram Gupta",    block: "Sports Complex",  teachers: 4,  subjects: ["Athletics", "Yoga", "Team Sports"],       budget: 415000,  spent: 388000, status: "active"  },
  { id: "DP09", name: "Fine Arts",         code: "ART",  hod: "Ms. Shalini Desai",   block: "Activity Block",  teachers: 3,  subjects: ["Drawing", "Craft", "Sculpture"],          budget: 165000,  spent: 92000,  status: "active"  },
  { id: "DP10", name: "Music & Dance",     code: "MUS",  hod: "Mr. Kartik Iyer",     block: "Activity Block",  teachers: 3,  subjects: ["Vocal", "Tabla", "Bharatanatyam"],        budget: 148000,  spent: 137000, status: "active"  },
  { id: "DP11", name: "Sanskrit",          code: "SAN",  hod: "Ms. Lata Trivedi",    block: "Main Block",      teachers: 2,  subjects: ["Shloka", "Vyakaran"],                     budget: 96000,   spent: 41000,  status: "review"  },
  { id: "DP12", name: "Library Sciences",  code: "LIB",  hod: "Ms. Kavita Joshi",    block: "Library Block",   teachers: 2,  subjects: ["Reading Skills", "Reference"],            budget: 210000,  spent: 158000, status: "active"  },
  { id: "DP13", name: "Special Education", code: "SPED", hod: "Ms. Farida Sheikh",   block: "Counselling Wing",teachers: 3,  subjects: ["Remedial", "Life Skills"],                budget: 182000,  spent: 74000,  status: "active"  },
  { id: "DP14", name: "Vocational Studies",code: "VOC",  hod: "Mr. Naveen Chawla",   block: "Activity Block",  teachers: 2,  subjects: ["Electronics", "Retail"],                  budget: 134000,  spent: 22000,  status: "review"  },
  { id: "DP15", name: "Foreign Languages", code: "FLN",  hod: "Ms. Elena D'Souza",   block: "Senior Wing",     teachers: 2,  subjects: ["French", "German"],                       budget: 118000,  spent: 39000,  status: "planned" },
];

type Department = (typeof departments)[number];

const STATUS_VARIANT: Record<string, "success" | "warning" | "info"> = {
  active: "success",
  review: "warning",
  planned: "info",
};

const BLOCK_OPTIONS = [...new Set(departments.map((d) => d.block))].map((b) => ({
  label: b,
  value: b,
}));

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Spent-vs-budget meter. Turns amber past 75% and red once overspent. */
function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const fill = pct >= 95 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-success";

  return (
    <div className="min-w-32">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-text">{inr(spent)}</span>
        <span className="text-subtle">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [block, setBlock] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return departments.filter((d) => {
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.hod.toLowerCase().includes(q) ||
        d.subjects.some((s) => s.toLowerCase().includes(q));
      return matchesSearch && (!block || d.block === block) && (!status || d.status === status);
    });
  }, [search, block, status]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const stats = useMemo(() => {
    const totalTeachers = departments.reduce((sum, d) => sum + d.teachers, 0);
    const totalBudget = departments.reduce((sum, d) => sum + d.budget, 0);
    const totalSpent = departments.reduce((sum, d) => sum + d.spent, 0);
    return {
      count: departments.length,
      totalTeachers,
      totalBudget,
      utilisation: Math.round((totalSpent / totalBudget) * 100),
    };
  }, []);

  const columns: Column<Department>[] = [
    {
      key: "name",
      header: "Department",
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md gradient-indigo text-xs font-semibold text-white">
            {d.code}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{d.name}</p>
            <p className="truncate text-xs text-subtle">{d.block}</p>
          </div>
        </div>
      ),
    },
    {
      key: "hod",
      header: "Head of Dept.",
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={d.hod} size="sm" />
          <span className="whitespace-nowrap font-medium text-text">{d.hod}</span>
        </div>
      ),
    },
    {
      key: "teachers",
      header: "Teachers",
      sortable: true,
      align: "right",
      render: (d) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-text">
          <Users className="size-3.5 text-subtle" />
          {d.teachers}
        </span>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      render: (d) => (
        <div className="flex flex-wrap gap-1">
          {d.subjects.map((s) => (
            <Badge key={s} variant="info">
              {s}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "budget",
      header: "Annual budget",
      sortable: true,
      align: "right",
      render: (d) => <span className="whitespace-nowrap text-muted">{inr(d.budget)}</span>,
    },
    {
      key: "spent",
      header: "Utilisation",
      sortable: true,
      render: (d) => <BudgetBar spent={d.spent} budget={d.budget} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (d) => (
        <Badge variant={STATUS_VARIANT[d.status]} className="capitalize">
          {d.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Departments"
        description="Academic departments, their heads, staffing and annual budgets."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              New department
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Departments" value={stats.count} icon={Building2} tone="indigo" />
        <StatCard label="Teaching staff" value={stats.totalTeachers} icon={Users} tone="emerald" />
        <StatCard label="Total budget" value={inr(stats.totalBudget)} icon={IndianRupee} tone="violet" />
        <StatCard
          label="Budget utilised"
          value={stats.utilisation}
          suffix="%"
          icon={Wallet}
          tone="amber"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by department, code, HOD or subject…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search departments"
          />
        </div>
        <div className="w-52">
          <Select
            value={block}
            onChange={(e) => applyFilter(setBlock)(e.target.value)}
            placeholder="All blocks"
            options={BLOCK_OPTIONS}
            aria-label="Filter by block"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Active", value: "active" },
              { label: "Under review", value: "review" },
              { label: "Planned", value: "planned" },
            ]}
            aria-label="Filter by status"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(d) => d.id}
        rowClassName={(d) => (d.status === "planned" ? "opacity-70" : undefined)}
        emptyTitle="No departments found"
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
