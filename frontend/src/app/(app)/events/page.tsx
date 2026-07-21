"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Images,
  MapPin,
  Plus,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import {
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

const PAGE_SIZE = 8;

type EventCategory = "Cultural" | "Sports" | "Academic" | "Competition";
type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
type RegistrationStatus = "open" | "closing-soon" | "closed" | "not-required";

interface SchoolEvent {
  id: string;
  name: string;
  category: EventCategory;
  date: string;
  venue: string;
  coordinator: string;
  participants: number;
  capacity: number;
  registration: RegistrationStatus;
  status: EventStatus;
  mediaCount: number;
}

const EVENTS: SchoolEvent[] = [
  {
    id: "EV-2401",
    name: "Annual Day — Rangmanch 2026",
    category: "Cultural",
    date: "2026-08-14",
    venue: "Main Auditorium",
    coordinator: "Meenakshi Iyer",
    participants: 420,
    capacity: 600,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2402",
    name: "Inter-House Sports Day",
    category: "Sports",
    date: "2026-08-02",
    venue: "School Playground",
    coordinator: "Rajesh Nair",
    participants: 512,
    capacity: 550,
    registration: "closing-soon",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2403",
    name: "Science Exhibition — Vigyan Mela",
    category: "Academic",
    date: "2026-07-24",
    venue: "Physics & Chemistry Labs",
    coordinator: "Dr. Anjali Deshmukh",
    participants: 168,
    capacity: 200,
    registration: "open",
    status: "upcoming",
    mediaCount: 4,
  },
  {
    id: "EV-2404",
    name: "Independence Day Celebration",
    category: "Cultural",
    date: "2026-08-15",
    venue: "Assembly Ground",
    coordinator: "Sunita Bhardwaj",
    participants: 980,
    capacity: 1000,
    registration: "not-required",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2405",
    name: "Inter-School Debate — Vaad Vivaad",
    category: "Competition",
    date: "2026-07-19",
    venue: "Seminar Hall B",
    coordinator: "Farhan Qureshi",
    participants: 64,
    capacity: 80,
    registration: "closed",
    status: "ongoing",
    mediaCount: 12,
  },
  {
    id: "EV-2406",
    name: "Annual Athletics Meet",
    category: "Sports",
    date: "2026-06-28",
    venue: "District Stadium, Pune",
    coordinator: "Rajesh Nair",
    participants: 245,
    capacity: 300,
    registration: "closed",
    status: "completed",
    mediaCount: 86,
  },
  {
    id: "EV-2407",
    name: "Mathematics Olympiad — Round 2",
    category: "Competition",
    date: "2026-07-30",
    venue: "Exam Hall, Block C",
    coordinator: "Priya Ramanathan",
    participants: 132,
    capacity: 150,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2408",
    name: "Ganesh Chaturthi Cultural Evening",
    category: "Cultural",
    date: "2026-09-05",
    venue: "Main Auditorium",
    coordinator: "Meenakshi Iyer",
    participants: 210,
    capacity: 600,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2409",
    name: "Inter-House Kabaddi Championship",
    category: "Sports",
    date: "2026-07-11",
    venue: "Indoor Sports Complex",
    coordinator: "Vikram Chauhan",
    participants: 96,
    capacity: 120,
    registration: "closed",
    status: "completed",
    mediaCount: 54,
  },
  {
    id: "EV-2410",
    name: "Hindi Diwas Kavita Recitation",
    category: "Competition",
    date: "2026-09-14",
    venue: "Seminar Hall A",
    coordinator: "Kavita Joshi",
    participants: 78,
    capacity: 100,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2411",
    name: "Robotics & Coding Hackathon",
    category: "Academic",
    date: "2026-08-22",
    venue: "Computer Lab 1 & 2",
    coordinator: "Arjun Mehta",
    participants: 88,
    capacity: 96,
    registration: "closing-soon",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2412",
    name: "Annual Art & Craft Exhibition",
    category: "Cultural",
    date: "2026-06-14",
    venue: "Activity Centre",
    coordinator: "Shalini Kapoor",
    participants: 156,
    capacity: 180,
    registration: "closed",
    status: "completed",
    mediaCount: 120,
  },
  {
    id: "EV-2413",
    name: "Inter-School Cricket Tournament",
    category: "Sports",
    date: "2026-10-08",
    venue: "District Stadium, Pune",
    coordinator: "Vikram Chauhan",
    participants: 44,
    capacity: 60,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2414",
    name: "Quiz Bee — Gyan Sangram",
    category: "Competition",
    date: "2026-05-30",
    venue: "Seminar Hall B",
    coordinator: "Farhan Qureshi",
    participants: 120,
    capacity: 120,
    registration: "closed",
    status: "completed",
    mediaCount: 38,
  },
  {
    id: "EV-2415",
    name: "Teachers' Day Programme",
    category: "Cultural",
    date: "2026-09-05",
    venue: "Assembly Ground",
    coordinator: "Sunita Bhardwaj",
    participants: 640,
    capacity: 1000,
    registration: "not-required",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2416",
    name: "Model United Nations — PuneMUN",
    category: "Academic",
    date: "2026-11-21",
    venue: "Conference Centre",
    coordinator: "Priya Ramanathan",
    participants: 52,
    capacity: 140,
    registration: "open",
    status: "upcoming",
    mediaCount: 0,
  },
  {
    id: "EV-2417",
    name: "Swachh Bharat Cleanliness Drive",
    category: "Academic",
    date: "2026-04-18",
    venue: "Kothrud Ward, Pune",
    coordinator: "Nikhil Bansal",
    participants: 310,
    capacity: 350,
    registration: "closed",
    status: "completed",
    mediaCount: 62,
  },
  {
    id: "EV-2418",
    name: "Inter-House Swimming Gala",
    category: "Sports",
    date: "2026-07-05",
    venue: "School Swimming Pool",
    coordinator: "Rajesh Nair",
    participants: 0,
    capacity: 90,
    registration: "closed",
    status: "cancelled",
    mediaCount: 0,
  },
];

const CATEGORY_VARIANT: Record<EventCategory, "info" | "success" | "warning" | "default"> = {
  Cultural: "info",
  Sports: "success",
  Academic: "warning",
  Competition: "default",
};

const STATUS_VARIANT: Record<EventStatus, "success" | "warning" | "info" | "danger"> = {
  upcoming: "info",
  ongoing: "warning",
  completed: "success",
  cancelled: "danger",
};

const REGISTRATION_VARIANT: Record<
  RegistrationStatus,
  "success" | "warning" | "default" | "outline"
> = {
  open: "success",
  "closing-soon": "warning",
  closed: "default",
  "not-required": "outline",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
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
    return EVENTS.filter((e) => {
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.coordinator.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q);
      const matchesCategory = !category || e.category === category;
      const matchesStatus = !status || e.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, category, status]);

  const stats = useMemo(() => {
    const upcoming = EVENTS.filter((e) => e.status === "upcoming").length;
    const completed = EVENTS.filter((e) => e.status === "completed").length;
    const participants = EVENTS.reduce((sum, e) => sum + e.participants, 0);
    const media = EVENTS.reduce((sum, e) => sum + e.mediaCount, 0);
    return { upcoming, completed, participants, media };
  }, []);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const columns: Column<SchoolEvent>[] = [
    {
      key: "name",
      header: "Event",
      sortable: true,
      sortValue: (e) => e.name,
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{e.name}</p>
          <p className="mt-0.5 truncate text-xs text-subtle">
            {e.id} · {e.coordinator}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (e) => <Badge variant={CATEGORY_VARIANT[e.category]}>{e.category}</Badge>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
          <CalendarDays className="size-3.5 text-subtle" />
          {formatDate(e.date)}
        </span>
      ),
    },
    {
      key: "venue",
      header: "Venue",
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <MapPin className="size-3.5 shrink-0 text-subtle" />
          {e.venue}
        </span>
      ),
    },
    {
      key: "participants",
      header: "Participants",
      sortable: true,
      render: (e) => {
        const pct = Math.min(100, Math.round((e.participants / e.capacity) * 100));
        return (
          <div className="min-w-28">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-text">{e.participants}</span>
              <span className="text-subtle">of {e.capacity}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={
                  pct >= 90 ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-primary"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "registration",
      header: "Registration",
      sortable: true,
      render: (e) => (
        <Badge variant={REGISTRATION_VARIANT[e.registration]} className="capitalize">
          {e.registration.replace("-", " ")}
        </Badge>
      ),
    },
    {
      key: "mediaCount",
      header: "Media",
      align: "right",
      sortable: true,
      render: (e) =>
        e.mediaCount > 0 ? (
          <Tooltip content={`${e.mediaCount} photos & videos in the gallery`}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
              <Images className="size-3.5 text-subtle" />
              {e.mediaCount}
            </span>
          </Tooltip>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (e) => (
        <Badge variant={STATUS_VARIANT[e.status]} className="capitalize">
          {e.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Events"
        description="Plan and track annual day, sports day and inter-school competitions."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export schedule
            </Button>
            <Button>
              <Plus className="size-4" />
              Create event
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming events" value={stats.upcoming} icon={CalendarDays} tone="indigo" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Total participants" value={stats.participants} icon={Users} tone="violet" />
        <StatCard label="Media uploaded" value={stats.media} icon={Images} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by event, venue or coordinator…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search events"
          />
        </div>
        <div className="w-44">
          <Select
            value={category}
            onChange={(e) => applyFilter(setCategory)(e.target.value)}
            placeholder="All categories"
            options={[
              { label: "Cultural", value: "Cultural" },
              { label: "Sports", value: "Sports" },
              { label: "Academic", value: "Academic" },
              { label: "Competition", value: "Competition" },
            ]}
            aria-label="Filter by category"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Upcoming", value: "upcoming" },
              { label: "Ongoing", value: "ongoing" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ]}
            aria-label="Filter by status"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(e) => e.id}
        rowClassName={(e) => (e.status === "cancelled" ? "opacity-60" : undefined)}
        emptyTitle="No events found"
        emptyDescription="Try clearing your filters to see more results."
        emptyAction={
          <Button variant="outline" onClick={() => { setSearch(""); setCategory(""); setStatus(""); setPage(1); }}>
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

      <p className="flex items-center gap-1.5 text-xs text-subtle">
        <Trophy className="size-3.5" />
        Winners and certificates are published within 48 hours of each competition.
      </p>
    </div>
  );
}
