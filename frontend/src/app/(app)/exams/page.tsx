"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  PageHeader,
  Pagination,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const exams = [
  { id: "EX001", name: "Unit Test 1",       type: "Unit Test", class: "10-A", subject: "Mathematics",  date: "Jul 20, 2025", time: "9:00 AM", duration: "1 hr",   totalMarks: 25,  status: "upcoming",   students: 42 },
  { id: "EX002", name: "Mid-Term Exam",      type: "Mid-Term",  class: "All", subject: "All Subjects", date: "Jul 28, 2025", time: "8:30 AM", duration: "3 hrs",  totalMarks: 100, status: "upcoming",   students: 1240 },
  { id: "EX003", name: "Unit Test 1",        type: "Unit Test", class: "9-B", subject: "Physics",      date: "Jul 15, 2025", time: "10:00 AM",duration: "1 hr",   totalMarks: 25,  status: "completed",  students: 38 },
  { id: "EX004", name: "Practical Exam",     type: "Practical", class: "12-A",subject: "Chemistry",    date: "Jul 10, 2025", time: "9:00 AM", duration: "2 hrs",  totalMarks: 30,  status: "completed",  students: 35 },
  { id: "EX005", name: "Class Test",         type: "Class Test",class: "8-A", subject: "English",      date: "Jul 18, 2025", time: "11:00 AM",duration: "45 min", totalMarks: 20,  status: "ongoing",    students: 44 },
  { id: "EX006", name: "Final Exam",         type: "Final",     class: "All", subject: "All Subjects", date: "Oct 15, 2025", time: "8:30 AM", duration: "3 hrs",  totalMarks: 100, status: "upcoming",   students: 1240 },
  { id: "EX007", name: "Unit Test 2",        type: "Unit Test", class: "11-A",subject: "Biology",      date: "Jul 08, 2025", time: "9:00 AM", duration: "1 hr",   totalMarks: 25,  status: "completed",  students: 40 },
  { id: "EX008", name: "Assignment Test",    type: "Class Test",class: "7-A", subject: "History",      date: "Jul 22, 2025", time: "10:30 AM",duration: "30 min", totalMarks: 15,  status: "upcoming",   students: 36 },
];

type Exam = (typeof exams)[number];
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const PAGE_SIZE = 6;

const statusConfig: Record<string, { variant: BadgeVariant; icon: LucideIcon; label: string }> = {
  upcoming: { variant: "info", icon: Clock, label: "Upcoming" },
  ongoing: { variant: "warning", icon: AlertCircle, label: "Ongoing" },
  completed: { variant: "success", icon: CheckCircle, label: "Completed" },
  cancelled: { variant: "danger", icon: XCircle, label: "Cancelled" },
};

/** Per exam-type presentation: badge tone, icon-tile gradient, timeline dot colour. */
const typeConfig: Record<string, { variant: BadgeVariant; gradient: string; dot: string }> = {
  "Unit Test": { variant: "info", gradient: "gradient-cyan", dot: "bg-info" },
  "Mid-Term": { variant: "default", gradient: "gradient-violet", dot: "bg-primary" },
  Final: { variant: "danger", gradient: "gradient-rose", dot: "bg-danger" },
  Practical: { variant: "success", gradient: "gradient-emerald", dot: "bg-success" },
  "Class Test": { variant: "warning", gradient: "gradient-amber", dot: "bg-warning" },
};

const fallbackType = { variant: "default" as BadgeVariant, gradient: "gradient-indigo", dot: "bg-border-strong" };

const tabs = ["All", "Upcoming", "Ongoing", "Completed"];

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      exams.filter((e) => {
        const matchTab = activeTab === "All" || e.status === activeTab.toLowerCase();
        const q = search.toLowerCase();
        const matchSearch =
          e.name.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.class.toLowerCase().includes(q);
        return matchTab && matchSearch;
      }),
    [activeTab, search]
  );

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const counts = {
    upcoming: exams.filter((e) => e.status === "upcoming").length,
    ongoing: exams.filter((e) => e.status === "ongoing").length,
    completed: exams.filter((e) => e.status === "completed").length,
  };

  const upcomingExams = exams.filter((e) => e.status === "upcoming");

  const columns: Column<Exam>[] = [
    {
      key: "name",
      header: "Exam",
      sortable: true,
      render: (exam) => {
        const tc = typeConfig[exam.type] ?? fallbackType;
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md text-white",
                tc.gradient
              )}
            >
              <FileText className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{exam.name}</p>
              <p className="truncate text-xs text-subtle">{exam.id}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (exam) => (
        <Badge variant={(typeConfig[exam.type] ?? fallbackType).variant}>{exam.type}</Badge>
      ),
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (exam) => <Badge variant="info">{exam.class}</Badge>,
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (exam) => <span className="whitespace-nowrap text-text">{exam.subject}</span>,
    },
    {
      key: "date",
      header: "Date & Time",
      render: (exam) => (
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
            <Calendar className="size-3 text-subtle" />
            {exam.date}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-subtle">
            <Clock className="size-3" />
            {exam.time}
          </p>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (exam) => <span className="whitespace-nowrap text-muted">{exam.duration}</span>,
    },
    {
      key: "totalMarks",
      header: "Marks",
      sortable: true,
      align: "right",
      render: (exam) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {exam.totalMarks}
          <span className="ml-0.5 text-xs font-normal text-subtle">pts</span>
        </span>
      ),
    },
    {
      key: "students",
      header: "Students",
      sortable: true,
      align: "right",
      render: (exam) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
          <Users className="size-3.5 text-subtle" />
          {exam.students.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (exam) => {
        const sc = statusConfig[exam.status];
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1">
            <StatusIcon className="size-3" />
            {sc.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (exam) => (
        <div className="flex items-center justify-end gap-1">
          <button
            aria-label={`View ${exam.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`Edit ${exam.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Edit className="size-4" />
          </button>
          <button
            aria-label={`Delete ${exam.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Examinations"
        description="Schedule, manage and track all exams"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Schedule Exam
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Exams" value={exams.length} icon={FileText} tone="indigo" />
        <StatCard label="Upcoming" value={counts.upcoming} icon={CalendarClock} tone="cyan" />
        <StatCard label="Ongoing" value={counts.ongoing} icon={Clock} tone="amber" />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              aria-pressed={activeTab === tab}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-w-60 max-w-xs flex-1">
          <Input
            type="search"
            placeholder="Search exams…"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search exams"
          />
        </div>

        <p className="ml-auto text-xs text-muted">{filtered.length} exams</p>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(e) => e.id}
        emptyTitle="No exams found"
        emptyDescription="Try adjusting your filters"
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />

      <Card>
        <CardHeader>
          <div>
            <p className="text-sm font-semibold text-text">Upcoming Exam Timeline</p>
            <p className="mt-0.5 text-xs text-muted">Next 3 months schedule</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col">
          {upcomingExams.map((exam, i, arr) => {
            const tc = typeConfig[exam.type] ?? fallbackType;
            const isLast = i === arr.length - 1;
            return (
              <div key={exam.id} className={cn("flex gap-4", !isLast && "pb-5")}>
                <div className="flex shrink-0 flex-col items-center">
                  <span className={cn("mt-1.5 size-3 rounded-full", tc.dot)} />
                  {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text">
                      {exam.name} — {exam.subject}
                    </p>
                    <Badge variant={tc.variant}>{exam.type}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3 text-subtle" />
                      {exam.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3 text-subtle" />
                      {exam.time} · {exam.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3 text-subtle" />
                      {exam.students.toLocaleString()} students
                    </span>
                    <span>
                      Class: <strong className="font-semibold text-text">{exam.class}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
