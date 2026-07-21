"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  MonitorPlay,
  Plus,
  Search,
  Upload,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
} from "@/components/ui";

const courses = [
  { id: "C01", title: "Mathematics — Class X",        subject: "Mathematics",      teacher: "Dr. Priya Sharma",   klass: "X",   enrolled: 124, capacity: 130, completion: 78, lessons: 42, status: "published" },
  { id: "C02", title: "Physics — Class XII",          subject: "Physics",          teacher: "Mr. Rahul Verma",    klass: "XII", enrolled: 86,  capacity: 90,  completion: 64, lessons: 38, status: "published" },
  { id: "C03", title: "English Literature — Class IX", subject: "English",         teacher: "Ms. Anita Patel",    klass: "IX",  enrolled: 118, capacity: 120, completion: 82, lessons: 30, status: "published" },
  { id: "C04", title: "Chemistry — Class XI",         subject: "Chemistry",        teacher: "Ms. Kavita Singh",   klass: "XI",  enrolled: 92,  capacity: 100, completion: 55, lessons: 36, status: "published" },
  { id: "C05", title: "Computer Science — Class X",   subject: "Computer Science", teacher: "Mr. Amit Joshi",     klass: "X",   enrolled: 76,  capacity: 80,  completion: 91, lessons: 28, status: "published" },
  { id: "C06", title: "Biology — Class XII",          subject: "Biology",          teacher: "Ms. Deepa Nair",     klass: "XII", enrolled: 68,  capacity: 75,  completion: 47, lessons: 34, status: "published" },
  { id: "C07", title: "History — Class IX",           subject: "History",          teacher: "Mr. Suresh Kumar",   klass: "IX",  enrolled: 110, capacity: 120, completion: 39, lessons: 26, status: "published" },
  { id: "C08", title: "Hindi Vyakaran — Class VII",   subject: "Hindi",            teacher: "Ms. Meenakshi Rao",  klass: "VII", enrolled: 132, capacity: 140, completion: 71, lessons: 24, status: "published" },
  { id: "C09", title: "Accountancy — Class XII",      subject: "Accountancy",      teacher: "Ms. Ritu Bansal",    klass: "XII", enrolled: 54,  capacity: 60,  completion: 66, lessons: 32, status: "published" },
  { id: "C10", title: "Sanskrit — Class VIII",        subject: "Sanskrit",         teacher: "Ms. Lata Trivedi",   klass: "VIII",enrolled: 88,  capacity: 110, completion: 28, lessons: 18, status: "draft"     },
  { id: "C11", title: "French Basics — Class XI",     subject: "French",           teacher: "Ms. Elena D'Souza",  klass: "XI",  enrolled: 34,  capacity: 45,  completion: 52, lessons: 20, status: "published" },
  { id: "C12", title: "Robotics Club — Class IX",     subject: "Electronics",      teacher: "Mr. Naveen Chawla",  klass: "IX",  enrolled: 28,  capacity: 40,  completion: 15, lessons: 14, status: "draft"     },
];

const recentActivity = [
  { id: "A1", who: "Dr. Priya Sharma",  action: "uploaded",  target: "Trigonometry — Worksheet 4",     when: "12 min ago", kind: "material" },
  { id: "A2", who: "Aarav Mehta",       action: "completed", target: "Quadratic Equations — Lesson 12", when: "38 min ago", kind: "progress" },
  { id: "A3", who: "Mr. Amit Joshi",    action: "started",   target: "Live class: Python Loops",        when: "1 hr ago",   kind: "class"    },
  { id: "A4", who: "Ms. Kavita Singh",  action: "graded",    target: "Organic Chemistry — Quiz 3",      when: "2 hrs ago",  kind: "progress" },
  { id: "A5", who: "Ishita Rao",        action: "submitted", target: "English Essay — The Monsoon",     when: "3 hrs ago",  kind: "progress" },
  { id: "A6", who: "Ms. Deepa Nair",    action: "published", target: "Genetics — Video Lecture 6",      when: "5 hrs ago",  kind: "material" },
  { id: "A7", who: "Mr. Rahul Verma",   action: "scheduled", target: "Live class: Wave Optics",         when: "Yesterday",  kind: "class"    },
  { id: "A8", who: "Vihaan Kulkarni",   action: "enrolled",  target: "Computer Science — Class X",      when: "Yesterday",  kind: "progress" },
];

const ACTIVITY_META: Record<string, { variant: "info" | "success" | "warning"; label: string }> = {
  material: { variant: "info", label: "Material" },
  progress: { variant: "success", label: "Progress" },
  class: { variant: "warning", label: "Class" },
};

const SUBJECT_OPTIONS = [...new Set(courses.map((c) => c.subject))]
  .sort()
  .map((s) => ({ label: s, value: s }));

const CLASS_OPTIONS = [...new Set(courses.map((c) => c.klass))].map((c) => ({
  label: `Class ${c}`,
  value: c,
}));

/** Completion ring colour tracks how far the cohort has got. */
function completionFill(pct: number) {
  if (pct >= 75) return "bg-success";
  if (pct >= 50) return "bg-info";
  if (pct >= 30) return "bg-warning";
  return "bg-danger";
}

export default function LmsOverviewPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [klass, setKlass] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.teacher.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (!subject || c.subject === subject) &&
        (!klass || c.klass === klass) &&
        (!status || c.status === status)
      );
    });
  }, [search, subject, klass, status]);

  const stats = useMemo(() => {
    const enrolled = courses.reduce((sum, c) => sum + c.enrolled, 0);
    const avgCompletion = Math.round(
      courses.reduce((sum, c) => sum + c.completion, 0) / courses.length
    );
    const lessons = courses.reduce((sum, c) => sum + c.lessons, 0);
    return {
      courses: courses.length,
      enrolled,
      avgCompletion,
      lessons,
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Learning Management"
        description="Course catalogue, enrolment and learner progress across the school."
        actions={
          <>
            <Button variant="outline">
              <Upload className="size-4" />
              Import course
            </Button>
            <Button>
              <Plus className="size-4" />
              New course
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active courses" value={stats.courses} icon={BookOpen} tone="indigo" trend={8} />
        <StatCard label="Total enrolments" value={stats.enrolled} icon={Users} tone="emerald" trend={12} />
        <StatCard
          label="Avg. completion"
          value={stats.avgCompletion}
          suffix="%"
          icon={CheckCircle2}
          tone="cyan"
          trend={5}
        />
        <StatCard label="Lessons published" value={stats.lessons} icon={GraduationCap} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search courses, subjects or teachers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search courses"
          />
        </div>
        <div className="w-48">
          <Select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="All subjects"
            options={SUBJECT_OPTIONS}
            aria-label="Filter by subject"
          />
        </div>
        <div className="w-40">
          <Select
            value={klass}
            onChange={(e) => setKlass(e.target.value)}
            placeholder="All classes"
            options={CLASS_OPTIONS}
            aria-label="Filter by class"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
            ]}
            aria-label="Filter by status"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                title="No courses found"
                description="Try clearing your filters to see more results."
                icon={<BookOpen className="size-5" />}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((c) => (
                <Card key={c.id} className="card-hover">
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md gradient-indigo text-white">
                        <BookOpen className="size-4.5" />
                      </div>
                      <Badge variant={c.status === "published" ? "success" : "default"} className="capitalize">
                        {c.status}
                      </Badge>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">{c.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {c.lessons} lessons · Class {c.klass}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.teacher} size="sm" />
                      <span className="truncate text-xs text-muted">{c.teacher}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-muted">Completion</span>
                        <span className="font-medium text-text">{c.completion}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className={`h-full rounded-full ${completionFill(c.completion)}`}
                          style={{ width: `${c.completion}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Users className="size-3.5 text-subtle" />
                        {c.enrolled} / {c.capacity} enrolled
                      </span>
                      <Link
                        href="/lms/material"
                        className="focus-ring rounded-sm font-medium text-primary-text transition-colors hover:text-primary"
                      >
                        Open
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text">Recent activity</h2>
              <Badge variant="info">Live</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {recentActivity.map((a) => {
                const meta = ACTIVITY_META[a.kind];
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <Avatar name={a.who} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text">
                        <span className="font-medium">{a.who}</span>{" "}
                        <span className="text-muted">{a.action}</span>
                      </p>
                      <p className="truncate text-xs text-muted">{a.target}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <span className="text-xs text-subtle">{a.when}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text">Quick links</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link
                href="/lms/classes"
                className="focus-ring flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                  <MonitorPlay className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text">Online classes</span>
                  <span className="block truncate text-xs text-muted">Live, scheduled and recorded</span>
                </span>
              </Link>
              <Link
                href="/lms/material"
                className="focus-ring flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                  <FileText className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text">Study material</span>
                  <span className="block truncate text-xs text-muted">PDFs, videos and notes</span>
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
