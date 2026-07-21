"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Clock,
  Plus,
  Radio,
  Search,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";

const PAGE_SIZE = 10;

const onlineClasses = [
  { id: "OC01", topic: "Quadratic Equations — Drill",  subject: "Mathematics",      teacher: "Dr. Priya Sharma",  klass: "X-A",   platform: "Google Meet", state: "live",      when: "Now · started 10:05", duration: 45, attendees: 118, link: "meet.google.com/xkq-mnvz-abc" },
  { id: "OC02", topic: "Python Loops & Functions",     subject: "Computer Science", teacher: "Mr. Amit Joshi",    klass: "X-B",   platform: "Zoom",        state: "live",      when: "Now · started 10:15", duration: 60, attendees: 74,  link: "zoom.us/j/8842103991" },
  { id: "OC03", topic: "Organic Chemistry — Alkanes",  subject: "Chemistry",        teacher: "Ms. Kavita Singh",  klass: "XI-B",  platform: "Google Meet", state: "live",      when: "Now · started 10:20", duration: 50, attendees: 88,  link: "meet.google.com/pqr-stuv-wxy" },
  { id: "OC04", topic: "Wave Optics — Interference",   subject: "Physics",          teacher: "Mr. Rahul Verma",   klass: "XII-A", platform: "Zoom",        state: "scheduled", when: "Today · 11:30",       duration: 45, attendees: 86,  link: "zoom.us/j/7712449021" },
  { id: "OC05", topic: "The Monsoon — Essay Workshop", subject: "English",          teacher: "Ms. Anita Patel",   klass: "IX-A",  platform: "Google Meet", state: "scheduled", when: "Today · 12:15",       duration: 40, attendees: 112, link: "meet.google.com/lmn-opqr-stu" },
  { id: "OC06", topic: "Genetics — Mendel's Laws",     subject: "Biology",          teacher: "Ms. Deepa Nair",    klass: "XII-B", platform: "Teams",       state: "scheduled", when: "Today · 14:00",       duration: 50, attendees: 68,  link: "teams.microsoft.com/l/bio-xii" },
  { id: "OC07", topic: "Mughal Empire — Overview",     subject: "History",          teacher: "Mr. Suresh Kumar",  klass: "IX-B",  platform: "Google Meet", state: "scheduled", when: "Tomorrow · 09:30",    duration: 40, attendees: 105, link: "meet.google.com/hij-klmn-opq" },
  { id: "OC08", topic: "Ledger Posting — Practice",    subject: "Accountancy",      teacher: "Ms. Ritu Bansal",   klass: "XII-C", platform: "Zoom",        state: "scheduled", when: "Tomorrow · 11:00",    duration: 45, attendees: 52,  link: "zoom.us/j/6620037745" },
  { id: "OC09", topic: "Hindi Vyakaran — Sandhi",      subject: "Hindi",            teacher: "Ms. Meenakshi Rao", klass: "VII-A", platform: "Google Meet", state: "recorded",  when: "18 Jul · 10:00",      duration: 38, attendees: 128, link: "drive.google.com/hin-sandhi-07" },
  { id: "OC10", topic: "Trigonometry — Identities",    subject: "Mathematics",      teacher: "Dr. Priya Sharma",  klass: "X-B",   platform: "Zoom",        state: "recorded",  when: "17 Jul · 09:15",      duration: 47, attendees: 121, link: "drive.google.com/math-trig-11" },
  { id: "OC11", topic: "Thermodynamics — Part 2",      subject: "Physics",          teacher: "Mr. Rahul Verma",   klass: "XI-A",  platform: "Zoom",        state: "recorded",  when: "17 Jul · 12:30",      duration: 52, attendees: 79,  link: "drive.google.com/phy-thermo-02" },
  { id: "OC12", topic: "French Greetings & Numbers",   subject: "French",           teacher: "Ms. Elena D'Souza", klass: "XI-A",  platform: "Teams",       state: "recorded",  when: "16 Jul · 15:00",      duration: 35, attendees: 32,  link: "teams.microsoft.com/l/fr-xi" },
  { id: "OC13", topic: "Cell Structure — Revision",    subject: "Biology",          teacher: "Ms. Deepa Nair",    klass: "XI-B",  platform: "Google Meet", state: "recorded",  when: "16 Jul · 11:45",      duration: 42, attendees: 71,  link: "drive.google.com/bio-cell-05" },
  { id: "OC14", topic: "Sanskrit Shloka Recitation",   subject: "Sanskrit",         teacher: "Ms. Lata Trivedi",  klass: "VIII-A",platform: "Google Meet", state: "cancelled", when: "16 Jul · 09:00",      duration: 30, attendees: 0,   link: "—" },
  { id: "OC15", topic: "Robotics — Sensor Basics",     subject: "Electronics",      teacher: "Mr. Naveen Chawla", klass: "IX-B",  platform: "Teams",       state: "scheduled", when: "Tomorrow · 15:30",    duration: 60, attendees: 26,  link: "teams.microsoft.com/l/rob-ix" },
  { id: "OC16", topic: "Algebra Doubt Clearing",       subject: "Mathematics",      teacher: "Mr. Rakesh Yadav",  klass: "IX-A",  platform: "Zoom",        state: "scheduled", when: "Tomorrow · 16:00",    duration: 30, attendees: 94,  link: "zoom.us/j/5590118824" },
];

type OnlineClass = (typeof onlineClasses)[number];

const STATE_META: Record<string, { label: string; variant: "success" | "info" | "default" | "danger" }> = {
  live: { label: "Live now", variant: "success" },
  scheduled: { label: "Scheduled", variant: "info" },
  recorded: { label: "Recorded", variant: "default" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

const SUBJECT_OPTIONS = [...new Set(onlineClasses.map((c) => c.subject))]
  .sort()
  .map((s) => ({ label: s, value: s }));

const TEACHER_OPTIONS = [...new Set(onlineClasses.map((c) => c.teacher))]
  .sort()
  .map((t) => ({ label: t, value: t }));

const liveClasses = onlineClasses.filter((c) => c.state === "live");

/** Pulsing dot marking a session that is running right now. */
function LiveDot() {
  return (
    <span className="relative flex size-2.5 shrink-0">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
      <span className="relative inline-flex size-2.5 rounded-full bg-success" />
    </span>
  );
}

export default function OnlineClassesPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return onlineClasses.filter((c) => {
      const matchesSearch =
        !q ||
        c.topic.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.teacher.toLowerCase().includes(q) ||
        c.klass.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (!subject || c.subject === subject) &&
        (!teacher || c.teacher === teacher) &&
        (!state || c.state === state)
      );
    });
  }, [search, subject, teacher, state]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const stats = useMemo(() => {
    const scheduled = onlineClasses.filter((c) => c.state === "scheduled").length;
    const recorded = onlineClasses.filter((c) => c.state === "recorded").length;
    const attendees = liveClasses.reduce((sum, c) => sum + c.attendees, 0);
    return { live: liveClasses.length, scheduled, recorded, attendees };
  }, []);

  const columns: Column<OnlineClass>[] = [
    {
      key: "topic",
      header: "Topic",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.state === "live" ? <LiveDot /> : null}
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{c.topic}</p>
            <p className="truncate text-xs text-subtle">
              {c.subject} · Class {c.klass}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "teacher",
      header: "Teacher",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.teacher} size="sm" />
          <span className="whitespace-nowrap text-muted">{c.teacher}</span>
        </div>
      ),
    },
    {
      key: "when",
      header: "Schedule",
      sortable: true,
      render: (c) => <span className="whitespace-nowrap text-muted">{c.when}</span>,
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      align: "right",
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
          <Clock className="size-3.5 text-subtle" />
          {c.duration} min
        </span>
      ),
    },
    {
      key: "attendees",
      header: "Attendees",
      sortable: true,
      align: "right",
      render: (c) =>
        c.attendees > 0 ? (
          <span className="font-medium text-text">{c.attendees}</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "platform",
      header: "Platform",
      sortable: true,
      render: (c) => <Badge variant="outline">{c.platform}</Badge>,
    },
    {
      key: "state",
      header: "Status",
      sortable: true,
      render: (c) => <Badge variant={STATE_META[c.state].variant}>{STATE_META[c.state].label}</Badge>,
    },
    {
      key: "link",
      header: "",
      align: "right",
      render: (c) =>
        c.state === "cancelled" ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
            <VideoOff className="size-3.5" />
            Cancelled
          </span>
        ) : (
          <Button size="sm" variant={c.state === "live" ? "primary" : "outline"}>
            <Video className="size-3.5" />
            {c.state === "live" ? "Join" : c.state === "recorded" ? "Watch" : "Details"}
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Online classes"
        description="Live sessions, upcoming schedule and the recorded lecture archive."
        actions={
          <>
            <Button variant="outline">
              <CalendarClock className="size-4" />
              Timetable
            </Button>
            <Button>
              <Plus className="size-4" />
              Schedule class
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live now" value={stats.live} icon={Radio} tone="emerald" />
        <StatCard label="Students in session" value={stats.attendees} icon={Users} tone="indigo" />
        <StatCard label="Scheduled" value={stats.scheduled} icon={CalendarClock} tone="cyan" />
        <StatCard label="Recorded lectures" value={stats.recorded} icon={Video} tone="violet" />
      </div>

      {liveClasses.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LiveDot />
            <h2 className="text-sm font-semibold text-text">Live right now</h2>
            <Badge variant="success">{liveClasses.length} running</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {liveClasses.map((c) => (
              <Card key={c.id} className="border-border-strong">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md gradient-emerald text-white">
                      <Radio className="size-4.5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-success-text">
                      <LiveDot />
                      Live
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{c.topic}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {c.subject} · Class {c.klass} · {c.platform}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.teacher} size="sm" />
                    <span className="truncate text-xs text-muted">{c.teacher}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-subtle" />
                      {c.when}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 text-subtle" />
                      {c.attendees} attending
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="truncate text-xs text-subtle">{c.link}</span>
                    <Button size="sm">
                      <Video className="size-3.5" />
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by topic, subject, teacher or class…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search online classes"
          />
        </div>
        <div className="w-48">
          <Select
            value={subject}
            onChange={(e) => applyFilter(setSubject)(e.target.value)}
            placeholder="All subjects"
            options={SUBJECT_OPTIONS}
            aria-label="Filter by subject"
          />
        </div>
        <div className="w-52">
          <Select
            value={teacher}
            onChange={(e) => applyFilter(setTeacher)(e.target.value)}
            placeholder="All teachers"
            options={TEACHER_OPTIONS}
            aria-label="Filter by teacher"
          />
        </div>
        <div className="w-40">
          <Select
            value={state}
            onChange={(e) => applyFilter(setState)(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Live now", value: "live" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Recorded", value: "recorded" },
              { label: "Cancelled", value: "cancelled" },
            ]}
            aria-label="Filter by status"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(c) => c.id}
        rowClassName={(c) => (c.state === "cancelled" ? "opacity-60" : undefined)}
        emptyTitle="No classes found"
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
