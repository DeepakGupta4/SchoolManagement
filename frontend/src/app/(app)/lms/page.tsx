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
import { useClassOptions } from "@/hooks/useClassOptions";

type Course = {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  klass: string;
  enrolled: number;
  capacity: number;
  completion: number;
  lessons: number;
  status: string;
};

type Activity = {
  id: string;
  who: string;
  action: string;
  target: string;
  when: string;
  kind: string;
};

const courses: Course[] = [];

const recentActivity: Activity[] = [];

const ACTIVITY_META: Record<string, { variant: "info" | "success" | "warning"; label: string }> = {
  material: { variant: "info", label: "Material" },
  progress: { variant: "success", label: "Progress" },
  class: { variant: "warning", label: "Class" },
};

const SUBJECT_OPTIONS = [...new Set(courses.map((c) => c.subject))]
  .sort()
  .map((s) => ({ label: s, value: s }));

/** Completion ring colour tracks how far the cohort has got. */
function completionFill(pct: number) {
  if (pct >= 75) return "bg-success";
  if (pct >= 50) return "bg-info";
  if (pct >= 30) return "bg-warning";
  return "bg-danger";
}

export default function LmsOverviewPage() {
  const { classOptions } = useClassOptions();
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
    const avgCompletion = courses.length
      ? Math.round(courses.reduce((sum, c) => sum + c.completion, 0) / courses.length)
      : 0;
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
            options={classOptions}
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
                title="No courses yet"
                description="Create a course to build your catalogue and enrol learners."
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
              {recentActivity.length === 0 ? (
                <EmptyState
                  title="No recent activity"
                  description="Uploads, submissions and progress will show up here."
                />
              ) : (
                recentActivity.map((a) => {
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
                })
              )}
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
