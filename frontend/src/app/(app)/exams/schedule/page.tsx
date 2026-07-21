"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Input,
  PageHeader,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const scheduleData = [
  { id: "EX001", exam: "Mid-Term Exam",   subject: "Mathematics",   class: "10-A", date: "Jul 28, 2025", time: "8:30 AM", duration: "3 hrs",  room: "Hall A", invigilator: "Dr. Priya Sharma",  totalMarks: 100, status: "upcoming" },
  { id: "EX002", exam: "Mid-Term Exam",   subject: "Physics",       class: "10-A", date: "Jul 29, 2025", time: "8:30 AM", duration: "3 hrs",  room: "Hall B", invigilator: "Mr. Rahul Verma",   totalMarks: 100, status: "upcoming" },
  { id: "EX003", exam: "Mid-Term Exam",   subject: "Chemistry",     class: "10-A", date: "Jul 30, 2025", time: "8:30 AM", duration: "3 hrs",  room: "Hall A", invigilator: "Ms. Kavita Singh",  totalMarks: 100, status: "upcoming" },
  { id: "EX004", exam: "Unit Test 1",     subject: "English",       class: "9-B",  date: "Jul 20, 2025", time: "10:00 AM",duration: "1 hr",   room: "Room 201", invigilator: "Ms. Anita Patel", totalMarks: 25,  status: "upcoming" },
  { id: "EX005", exam: "Class Test",      subject: "Biology",       class: "11-A", date: "Jul 18, 2025", time: "11:00 AM",duration: "45 min", room: "Room 301", invigilator: "Ms. Deepa Nair",  totalMarks: 20,  status: "ongoing"  },
  { id: "EX006", exam: "Unit Test 1",     subject: "History",       class: "8-A",  date: "Jul 10, 2025", time: "9:00 AM", duration: "1 hr",   room: "Room 106", invigilator: "Mr. Suresh Kumar",totalMarks: 25,  status: "completed"},
  { id: "EX007", exam: "Practical",       subject: "Chemistry",     class: "12-A", date: "Jul 08, 2025", time: "9:00 AM", duration: "2 hrs",  room: "Chem Lab", invigilator: "Ms. Kavita Singh", totalMarks: 30,  status: "completed"},
];

type ScheduledExam = (typeof scheduleData)[number];
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const statusVariant: Record<string, BadgeVariant> = {
  upcoming: "info",
  ongoing: "warning",
  completed: "success",
};

const tabs = ["All", "Upcoming", "Ongoing", "Completed"];

export default function ExamSchedulePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(
    () =>
      scheduleData.filter((e) => {
        const matchFilter = filter === "All" || e.status === filter.toLowerCase();
        const q = search.toLowerCase();
        const matchSearch =
          e.subject.toLowerCase().includes(q) ||
          e.class.toLowerCase().includes(q) ||
          e.exam.toLowerCase().includes(q);
        return matchFilter && matchSearch;
      }),
    [filter, search]
  );

  const columns: Column<ScheduledExam>[] = [
    {
      key: "exam",
      header: "Exam",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap font-medium text-text">{e.exam}</span>,
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap text-text">{e.subject}</span>,
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (e) => <Badge variant="info">{e.class}</Badge>,
    },
    {
      key: "date",
      header: "Date",
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-text">
          <Calendar className="size-3 text-subtle" />
          {e.date}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
          <Clock className="size-3 text-subtle" />
          {e.time}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (e) => <span className="whitespace-nowrap text-muted">{e.duration}</span>,
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap text-muted">{e.room}</span>,
    },
    {
      key: "invigilator",
      header: "Invigilator",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap text-text">{e.invigilator}</span>,
    },
    {
      key: "totalMarks",
      header: "Marks",
      sortable: true,
      align: "right",
      render: (e) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {e.totalMarks}
          <span className="ml-0.5 text-xs font-normal text-subtle">pts</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (e) => (
        <Badge variant={statusVariant[e.status] ?? "default"} className="capitalize">
          {e.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            aria-label={`View ${e.exam} — ${e.subject}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`Edit ${e.exam} — ${e.subject}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Edit className="size-4" />
          </button>
          <button
            aria-label={`Delete ${e.exam} — ${e.subject}`}
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
        title="Exam Schedule"
        description="View and manage all scheduled examinations"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add Exam
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Scheduled"
          value={scheduleData.length}
          icon={CalendarCheck}
          tone="indigo"
        />
        <StatCard
          label="Upcoming"
          value={scheduleData.filter((e) => e.status === "upcoming").length}
          icon={CalendarClock}
          tone="cyan"
        />
        <StatCard
          label="Ongoing"
          value={scheduleData.filter((e) => e.status === "ongoing").length}
          icon={PencilLine}
          tone="amber"
        />
        <StatCard
          label="Completed"
          value={scheduleData.filter((e) => e.status === "completed").length}
          icon={CheckCircle}
          tone="emerald"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              aria-pressed={filter === tab}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === tab
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
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search scheduled exams"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(e) => e.id}
        emptyTitle="No scheduled exams found"
        emptyDescription="Try adjusting your filters"
      />
    </div>
  );
}
