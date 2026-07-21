"use client";

import { useMemo, useState } from "react";
import {
  Atom,
  CalendarClock,
  FlaskConical,
  Microscope,
  Monitor,
  Package,
  Plus,
  Search,
  TriangleAlert,
  Users,
  Wrench,
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
  Tooltip,
  type Column,
} from "@/components/ui";

const PAGE_SIZE = 10;

type LabType = "Physics" | "Chemistry" | "Biology" | "Computer";
type LabStatus = "operational" | "maintenance" | "closed";

interface Lab {
  id: string;
  name: string;
  type: LabType;
  block: string;
  capacity: number;
  inCharge: string;
  assistant: string;
  equipmentTotal: number;
  equipmentWorking: number;
  weeklyPracticals: number;
  nextPractical: string;
  nextPracticalClass: string;
  status: LabStatus;
}

const LABS: Lab[] = [
  {
    id: "LB-01",
    name: "Physics Lab I",
    type: "Physics",
    block: "Science Block, Ground Floor",
    capacity: 40,
    inCharge: "Dr. Anjali Deshmukh",
    assistant: "Sandeep More",
    equipmentTotal: 186,
    equipmentWorking: 179,
    weeklyPracticals: 14,
    nextPractical: "2026-07-22",
    nextPracticalClass: "XII-A · Ohm's Law verification",
    status: "operational",
  },
  {
    id: "LB-02",
    name: "Physics Lab II",
    type: "Physics",
    block: "Science Block, First Floor",
    capacity: 36,
    inCharge: "Suresh Patil",
    assistant: "Sandeep More",
    equipmentTotal: 142,
    equipmentWorking: 121,
    weeklyPracticals: 9,
    nextPractical: "2026-07-23",
    nextPracticalClass: "XI-B · Simple pendulum",
    status: "maintenance",
  },
  {
    id: "LB-03",
    name: "Chemistry Lab I",
    type: "Chemistry",
    block: "Science Block, Ground Floor",
    capacity: 32,
    inCharge: "Kavita Joshi",
    assistant: "Ravi Gaikwad",
    equipmentTotal: 214,
    equipmentWorking: 208,
    weeklyPracticals: 16,
    nextPractical: "2026-07-22",
    nextPracticalClass: "XII-B · Salt analysis",
    status: "operational",
  },
  {
    id: "LB-04",
    name: "Chemistry Lab II",
    type: "Chemistry",
    block: "Science Block, First Floor",
    capacity: 32,
    inCharge: "Nikhil Bansal",
    assistant: "Ravi Gaikwad",
    equipmentTotal: 168,
    equipmentWorking: 160,
    weeklyPracticals: 11,
    nextPractical: "2026-07-24",
    nextPracticalClass: "XI-A · Titration practice",
    status: "operational",
  },
  {
    id: "LB-05",
    name: "Biology Lab I",
    type: "Biology",
    block: "Science Block, Second Floor",
    capacity: 34,
    inCharge: "Dr. Shobha Menon",
    assistant: "Pooja Salunke",
    equipmentTotal: 156,
    equipmentWorking: 151,
    weeklyPracticals: 12,
    nextPractical: "2026-07-25",
    nextPracticalClass: "XII-A · Mitosis in onion root tip",
    status: "operational",
  },
  {
    id: "LB-06",
    name: "Biology Lab II",
    type: "Biology",
    block: "Science Block, Second Floor",
    capacity: 30,
    inCharge: "Priyanka Shinde",
    assistant: "Pooja Salunke",
    equipmentTotal: 98,
    equipmentWorking: 74,
    weeklyPracticals: 7,
    nextPractical: "2026-07-28",
    nextPracticalClass: "X-C · Photosynthesis demo",
    status: "maintenance",
  },
  {
    id: "LB-07",
    name: "Computer Lab 1",
    type: "Computer",
    block: "IT Block, Ground Floor",
    capacity: 48,
    inCharge: "Arjun Mehta",
    assistant: "Sagar Kadam",
    equipmentTotal: 52,
    equipmentWorking: 50,
    weeklyPracticals: 22,
    nextPractical: "2026-07-21",
    nextPracticalClass: "XI-A · Python data structures",
    status: "operational",
  },
  {
    id: "LB-08",
    name: "Computer Lab 2",
    type: "Computer",
    block: "IT Block, First Floor",
    capacity: 48,
    inCharge: "Farhan Qureshi",
    assistant: "Sagar Kadam",
    equipmentTotal: 50,
    equipmentWorking: 46,
    weeklyPracticals: 20,
    nextPractical: "2026-07-21",
    nextPracticalClass: "XII-B · SQL queries",
    status: "operational",
  },
  {
    id: "LB-09",
    name: "Robotics & AtalTinkering Lab",
    type: "Computer",
    block: "IT Block, Second Floor",
    capacity: 24,
    inCharge: "Arjun Mehta",
    assistant: "Sagar Kadam",
    equipmentTotal: 134,
    equipmentWorking: 128,
    weeklyPracticals: 8,
    nextPractical: "2026-07-26",
    nextPracticalClass: "IX-A · Arduino sensors",
    status: "operational",
  },
  {
    id: "LB-10",
    name: "Junior Science Lab",
    type: "Biology",
    block: "Primary Block, Ground Floor",
    capacity: 28,
    inCharge: "Shalini Kapoor",
    assistant: "Pooja Salunke",
    equipmentTotal: 76,
    equipmentWorking: 72,
    weeklyPracticals: 10,
    nextPractical: "2026-07-23",
    nextPracticalClass: "VII-B · Plant cell slides",
    status: "operational",
  },
  {
    id: "LB-11",
    name: "Physics Demonstration Room",
    type: "Physics",
    block: "Science Block, Ground Floor",
    capacity: 60,
    inCharge: "Suresh Patil",
    assistant: "Sandeep More",
    equipmentTotal: 64,
    equipmentWorking: 61,
    weeklyPracticals: 5,
    nextPractical: "2026-07-29",
    nextPracticalClass: "X-A · Optics demo",
    status: "operational",
  },
  {
    id: "LB-12",
    name: "Chemistry Prep & Store Room",
    type: "Chemistry",
    block: "Science Block, Ground Floor",
    capacity: 12,
    inCharge: "Kavita Joshi",
    assistant: "Ravi Gaikwad",
    equipmentTotal: 320,
    equipmentWorking: 316,
    weeklyPracticals: 0,
    nextPractical: "2026-08-03",
    nextPracticalClass: "Stock audit — no class",
    status: "closed",
  },
  {
    id: "LB-13",
    name: "Language & Multimedia Lab",
    type: "Computer",
    block: "Arts Block, First Floor",
    capacity: 40,
    inCharge: "Meenakshi Iyer",
    assistant: "Sagar Kadam",
    equipmentTotal: 44,
    equipmentWorking: 38,
    weeklyPracticals: 6,
    nextPractical: "2026-07-27",
    nextPracticalClass: "VIII-A · Phonetics session",
    status: "operational",
  },
  {
    id: "LB-14",
    name: "Advanced Biotech Lab",
    type: "Biology",
    block: "Science Block, Second Floor",
    capacity: 20,
    inCharge: "Dr. Shobha Menon",
    assistant: "Pooja Salunke",
    equipmentTotal: 112,
    equipmentWorking: 88,
    weeklyPracticals: 4,
    nextPractical: "2026-08-01",
    nextPracticalClass: "XII-A · DNA extraction",
    status: "maintenance",
  },
];

const LAB_ICON: Record<LabType, typeof Atom> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Microscope,
  Computer: Monitor,
};

const LAB_GRADIENT: Record<LabType, string> = {
  Physics: "gradient-indigo",
  Chemistry: "gradient-amber",
  Biology: "gradient-emerald",
  Computer: "gradient-cyan",
};

const STATUS_VARIANT: Record<LabStatus, "success" | "warning" | "danger"> = {
  operational: "success",
  maintenance: "warning",
  closed: "danger",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export default function LabsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
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
    return LABS.filter((lab) => {
      const matchesSearch =
        !q ||
        lab.name.toLowerCase().includes(q) ||
        lab.inCharge.toLowerCase().includes(q) ||
        lab.block.toLowerCase().includes(q) ||
        lab.nextPracticalClass.toLowerCase().includes(q);
      const matchesType = !type || lab.type === type;
      const matchesStatus = !status || lab.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, type, status]);

  const stats = useMemo(() => {
    const equipment = LABS.reduce((sum, l) => sum + l.equipmentTotal, 0);
    const faulty = LABS.reduce((sum, l) => sum + (l.equipmentTotal - l.equipmentWorking), 0);
    const practicals = LABS.reduce((sum, l) => sum + l.weeklyPracticals, 0);
    return { labs: LABS.length, equipment, faulty, practicals };
  }, []);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const typeSummary = useMemo(() => {
    const types: LabType[] = ["Physics", "Chemistry", "Biology", "Computer"];
    return types.map((t) => {
      const group = LABS.filter((l) => l.type === t);
      return {
        type: t,
        count: group.length,
        seats: group.reduce((sum, l) => sum + l.capacity, 0),
        practicals: group.reduce((sum, l) => sum + l.weeklyPracticals, 0),
      };
    });
  }, []);

  const columns: Column<Lab>[] = [
    {
      key: "name",
      header: "Lab",
      sortable: true,
      sortValue: (l) => l.name,
      render: (l) => {
        const Icon = LAB_ICON[l.type];
        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-md text-white ${LAB_GRADIENT[l.type]}`}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{l.name}</p>
              <p className="truncate text-xs text-subtle">{l.block}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (l) => <Badge variant="info">{l.type}</Badge>,
    },
    {
      key: "inCharge",
      header: "Lab in-charge",
      sortable: true,
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={l.inCharge} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-muted">{l.inCharge}</p>
            <p className="truncate text-xs text-subtle">Asst. {l.assistant}</p>
          </div>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Seats",
      sortable: true,
      align: "right",
      render: (l) => <span className="whitespace-nowrap text-muted">{l.capacity}</span>,
    },
    {
      key: "equipmentWorking",
      header: "Equipment",
      sortable: true,
      sortValue: (l) => l.equipmentWorking / l.equipmentTotal,
      render: (l) => {
        const pct = Math.round((l.equipmentWorking / l.equipmentTotal) * 100);
        const faulty = l.equipmentTotal - l.equipmentWorking;
        return (
          <div className="min-w-32">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-text">
                {l.equipmentWorking}/{l.equipmentTotal}
              </span>
              <span className={faulty > 10 ? "text-danger-text" : "text-subtle"}>{pct}% ok</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={
                  pct >= 95
                    ? "h-full rounded-full bg-success"
                    : pct >= 85
                      ? "h-full rounded-full bg-warning"
                      : "h-full rounded-full bg-danger"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "nextPractical",
      header: "Next practical",
      sortable: true,
      render: (l) => (
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
            <CalendarClock className="size-3.5 text-subtle" />
            {formatDate(l.nextPractical)}
          </p>
          <p className="mt-0.5 truncate text-xs text-subtle">{l.nextPracticalClass}</p>
        </div>
      ),
    },
    {
      key: "weeklyPracticals",
      header: "Per week",
      sortable: true,
      align: "right",
      render: (l) => (
        <Tooltip content={`${l.weeklyPracticals} scheduled practical sessions each week`}>
          <span className="whitespace-nowrap font-medium text-text">{l.weeklyPracticals}</span>
        </Tooltip>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (l) => (
        <Badge variant={STATUS_VARIANT[l.status]} className="capitalize">
          {l.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Laboratories"
        description="Equipment inventory, capacity, lab in-charge and the practicals timetable."
        actions={
          <>
            <Button variant="outline">
              <Wrench className="size-4" />
              Log maintenance
            </Button>
            <Button>
              <Plus className="size-4" />
              Add lab
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total labs" value={stats.labs} icon={FlaskConical} tone="indigo" />
        <StatCard label="Equipment items" value={stats.equipment} icon={Package} tone="cyan" />
        <StatCard label="Needs repair" value={stats.faulty} icon={TriangleAlert} tone="rose" />
        <StatCard
          label="Practicals / week"
          value={stats.practicals}
          icon={CalendarClock}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {typeSummary.map((group) => {
          const Icon = LAB_ICON[group.type];
          return (
            <Card key={group.type}>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-md text-white ${LAB_GRADIENT[group.type]}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <p className="text-sm font-medium text-text">{group.type}</p>
                </div>
                <Badge variant="outline">{group.count} labs</Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Seats</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-lg font-semibold text-text">
                    <Users className="size-4 text-subtle" />
                    {group.seats}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Practicals / week</p>
                  <p className="mt-0.5 text-lg font-semibold text-text">{group.practicals}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by lab, in-charge or block…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search labs"
          />
        </div>
        <div className="w-44">
          <Select
            value={type}
            onChange={(e) => applyFilter(setType)(e.target.value)}
            placeholder="All lab types"
            options={[
              { label: "Physics", value: "Physics" },
              { label: "Chemistry", value: "Chemistry" },
              { label: "Biology", value: "Biology" },
              { label: "Computer", value: "Computer" },
            ]}
            aria-label="Filter by lab type"
          />
        </div>
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Operational", value: "operational" },
              { label: "Under maintenance", value: "maintenance" },
              { label: "Closed", value: "closed" },
            ]}
            aria-label="Filter by status"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(l) => l.id}
        rowClassName={(l) => (l.status === "closed" ? "opacity-60" : undefined)}
        emptyTitle="No labs found"
        emptyDescription="Try clearing your filters to see more results."
        emptyAction={
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setType("");
              setStatus("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        }
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
