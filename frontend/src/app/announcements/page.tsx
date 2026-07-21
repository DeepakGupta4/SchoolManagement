"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Bell,
  Pin,
  Trash2,
  Edit,
  Eye,
  Megaphone,
  Users,
  BookOpen,
  Bus,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const announcements = [
  { id: "AN001", title: "Annual Sports Day 2025",           body: "Annual Sports Day will be held on 28th July 2025. All students must participate in at least one event.", author: "Principal", audience: "All",      category: "Event",    date: "10 Jul 2025", pinned: true,  views: 320 },
  { id: "AN002", title: "Fee Payment Deadline Reminder",    body: "Last date for fee payment for Q2 is 20th July 2025. Late fee will be charged after the deadline.",      author: "Accounts",  audience: "Parents",  category: "Finance",  date: "12 Jul 2025", pinned: true,  views: 210 },
  { id: "AN003", title: "Staff Meeting – 18 July",          body: "All teaching and non-teaching staff are required to attend the meeting on 18th July at 3:00 PM.",        author: "Principal", audience: "Staff",    category: "Meeting",  date: "13 Jul 2025", pinned: false, views: 85  },
  { id: "AN004", title: "Exam Schedule Released",           body: "The mid-term exam schedule for classes 6–12 has been released. Check the notice board for details.",     author: "Exam Cell", audience: "Students", category: "Exam",     date: "14 Jul 2025", pinned: false, views: 450 },
  { id: "AN005", title: "Library Closed on 19 July",        body: "The school library will remain closed on 19th July 2025 due to maintenance work.",                       author: "Librarian", audience: "All",      category: "Notice",   date: "15 Jul 2025", pinned: false, views: 130 },
  { id: "AN006", title: "New Bus Route Added",              body: "A new bus route covering Sector 14 and Sector 18 has been added from 21st July 2025.",                   author: "Transport", audience: "Parents",  category: "Transport",date: "15 Jul 2025", pinned: false, views: 95  },
  { id: "AN007", title: "Parent-Teacher Meeting",           body: "PTM for classes 9–12 is scheduled on 26th July 2025 from 9 AM to 1 PM. Attendance is mandatory.",       author: "Principal", audience: "Parents",  category: "Meeting",  date: "16 Jul 2025", pinned: true,  views: 280 },
  { id: "AN008", title: "Holiday Notice – Eid",             body: "School will remain closed on 17th July 2025 on account of Eid. Classes will resume on 18th July.",       author: "Admin",     audience: "All",      category: "Holiday",  date: "16 Jul 2025", pinned: false, views: 510 },
];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const categoryConfig: Record<string, { variant: BadgeVariant; icon: React.ReactNode }> = {
  Event:     { variant: "info",    icon: <Megaphone className="size-3" /> },
  Finance:   { variant: "success", icon: <BookOpen className="size-3" /> },
  Meeting:   { variant: "default", icon: <Users className="size-3" /> },
  Exam:      { variant: "warning", icon: <BookOpen className="size-3" /> },
  Notice:    { variant: "outline", icon: <Bell className="size-3" /> },
  Transport: { variant: "info",    icon: <Bus className="size-3" /> },
  Holiday:   { variant: "danger",  icon: <Bell className="size-3" /> },
};

const audienceVariant: Record<string, BadgeVariant> = {
  All: "info",
  Parents: "warning",
  Staff: "default",
  Students: "success",
};

const tabs = ["All", "Pinned"] as const;

export default function AnnouncementsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");

  const filtered = announcements.filter((a) => {
    const matchTab = tab === "All" || a.pinned;
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.body.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "All" || a.category === categoryFilter;
    const matchAudience = audienceFilter === "All" || a.audience === audienceFilter;
    return matchTab && matchSearch && matchCategory && matchAudience;
  });

  const totalViews = announcements.reduce((s, a) => s + a.views, 0);
  const pinned = announcements.filter((a) => a.pinned).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Announcements"
        description="Broadcast notices to students, parents and staff."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              New announcement
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={announcements.length} icon={Megaphone} tone="amber" />
        <StatCard label="Pinned" value={pinned} icon={Pin} tone="indigo" />
        <StatCard label="Total views" value={totalViews} icon={Eye} tone="cyan" />
        <StatCard label="Audiences" value={4} icon={Users} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Announcement filter"
          className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface-raised p-1"
        >
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "focus-ring rounded-sm px-4 py-1.5 text-xs font-semibold transition-colors",
                tab === t
                  ? "bg-primary-soft text-primary-text"
                  : "text-muted hover:bg-surface-hover hover:text-text"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            icon={<Search className="size-4" />}
            aria-label="Search announcements"
          />
        </div>

        <div className="w-44">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            options={[
              { label: "All categories", value: "All" },
              ...Object.keys(categoryConfig).map((c) => ({ label: c, value: c })),
            ]}
          />
        </div>

        <div className="w-40">
          <Select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            aria-label="Filter by audience"
            options={[
              { label: "All audiences", value: "All" },
              ...["All", "Parents", "Staff", "Students"].map((a) => ({ label: a, value: a })),
            ]}
          />
        </div>

        <p className="ml-auto text-xs text-subtle">{filtered.length} announcements</p>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((a) => {
          const cc = categoryConfig[a.category] ?? {
            variant: "default" as BadgeVariant,
            icon: <Bell className="size-3" />,
          };
          return (
            <Card key={a.id} className={cn("card-hover", a.pinned && "border-warning")}>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {a.pinned && (
                      <Badge variant="warning" className="gap-1">
                        <Pin className="size-3" /> Pinned
                      </Badge>
                    )}
                    <Badge variant={cc.variant} className="gap-1">
                      {cc.icon} {a.category}
                    </Badge>
                    <Badge variant={audienceVariant[a.audience] ?? "default"}>{a.audience}</Badge>
                  </div>

                  <h3 className="text-sm font-semibold text-text">{a.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{a.body}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-subtle">
                    <span>
                      By <strong className="font-medium text-text">{a.author}</strong>
                    </span>
                    <span>{a.date}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" /> {a.views} views
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    aria-label={`Edit ${a.title}`}
                    className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button
                    aria-label={`Delete ${a.title}`}
                    className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card>
            <EmptyState
              icon={<Megaphone className="size-5" />}
              title="No announcements found"
              description="Try clearing your filters to see more results."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
