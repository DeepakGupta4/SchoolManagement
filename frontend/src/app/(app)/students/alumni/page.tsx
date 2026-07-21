"use client";

import React, { useState } from "react";
import {
  Award,
  Briefcase,
  Download,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
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
  type Column,
} from "@/components/ui";

const PAGE_SIZE = 10;

const alumni = [
  { id: "ALM-001", name: "Rohan Deshpande",   batch: "2014", stream: "Science",   occupation: "Software Engineer",   employer: "Infosys",            city: "Pune",       email: "rohan.d@example.in",    phone: "98765-43210", mentor: true  },
  { id: "ALM-002", name: "Sneha Kulkarni",    batch: "2014", stream: "Commerce",  occupation: "Chartered Accountant", employer: "Deloitte India",     city: "Mumbai",     email: "sneha.k@example.in",    phone: "98450-11223", mentor: true  },
  { id: "ALM-003", name: "Aditya Menon",      batch: "2015", stream: "Science",   occupation: "Doctor (MBBS, MD)",   employer: "AIIMS Delhi",        city: "New Delhi",  email: "aditya.m@example.in",   phone: "99887-65432", mentor: false },
  { id: "ALM-004", name: "Priya Raghavan",    batch: "2015", stream: "Arts",      occupation: "Civil Servant (IAS)", employer: "Govt. of Karnataka", city: "Bengaluru",  email: "priya.r@example.in",    phone: "90123-45678", mentor: true  },
  { id: "ALM-005", name: "Karthik Subraman",  batch: "2016", stream: "Science",   occupation: "Data Scientist",      employer: "Flipkart",           city: "Bengaluru",  email: "karthik.s@example.in",  phone: "88990-11223", mentor: false },
  { id: "ALM-006", name: "Meera Bhattachar",  batch: "2016", stream: "Commerce",  occupation: "Investment Banker",   employer: "ICICI Securities",   city: "Mumbai",     email: "meera.b@example.in",    phone: "97654-32109", mentor: true  },
  { id: "ALM-007", name: "Nikhil Chauhan",    batch: "2017", stream: "Science",   occupation: "Mechanical Engineer", employer: "Tata Motors",        city: "Jamshedpur", email: "nikhil.c@example.in",   phone: "96543-21098", mentor: false },
  { id: "ALM-008", name: "Tanvi Shah",        batch: "2017", stream: "Arts",      occupation: "Journalist",          employer: "The Hindu",          city: "Chennai",    email: "tanvi.s@example.in",    phone: "95432-10987", mentor: false },
  { id: "ALM-009", name: "Harsh Vardhan",     batch: "2018", stream: "Commerce",  occupation: "Startup Founder",     employer: "GreenCart Pvt Ltd",  city: "Gurugram",   email: "harsh.v@example.in",    phone: "94321-09876", mentor: true  },
  { id: "ALM-010", name: "Ritika Agarwal",    batch: "2018", stream: "Science",   occupation: "Architect",           employer: "Morphogenesis",      city: "New Delhi",  email: "ritika.a@example.in",   phone: "93210-98765", mentor: false },
  { id: "ALM-011", name: "Sameer Qureshi",    batch: "2019", stream: "Science",   occupation: "Research Scholar",    employer: "IISc Bengaluru",     city: "Bengaluru",  email: "sameer.q@example.in",   phone: "92109-87654", mentor: false },
  { id: "ALM-012", name: "Divya Pillai",      batch: "2019", stream: "Commerce",  occupation: "Product Manager",     employer: "Zomato",             city: "Gurugram",   email: "divya.p@example.in",    phone: "91098-76543", mentor: true  },
  { id: "ALM-013", name: "Abhinav Rathore",   batch: "2020", stream: "Arts",      occupation: "Lawyer",              employer: "AZB & Partners",     city: "Mumbai",     email: "abhinav.r@example.in",  phone: "90987-65432", mentor: false },
  { id: "ALM-014", name: "Shreya Nambiar",    batch: "2020", stream: "Science",   occupation: "Cardiologist",        employer: "Apollo Hospitals",   city: "Hyderabad",  email: "shreya.n@example.in",   phone: "89876-54321", mentor: true  },
  { id: "ALM-015", name: "Varun Malhotra",    batch: "2021", stream: "Commerce",  occupation: "Financial Analyst",   employer: "HDFC Bank",          city: "Mumbai",     email: "varun.m@example.in",    phone: "88765-43210", mentor: false },
  { id: "ALM-016", name: "Ayesha Siddiqui",   batch: "2021", stream: "Science",   occupation: "Civil Engineer",      employer: "L&T Construction",   city: "Chennai",    email: "ayesha.s@example.in",   phone: "87654-32109", mentor: false },
  { id: "ALM-017", name: "Manav Kapoor",      batch: "2022", stream: "Arts",      occupation: "Graphic Designer",    employer: "Freelance",          city: "Jaipur",     email: "manav.k@example.in",    phone: "86543-21098", mentor: false },
  { id: "ALM-018", name: "Ishani Barua",      batch: "2022", stream: "Science",   occupation: "M.Tech Student",      employer: "IIT Guwahati",       city: "Guwahati",   email: "ishani.b@example.in",   phone: "85432-10987", mentor: true  },
];

type Alumnus = (typeof alumni)[number];

const BATCH_OPTIONS = [...new Set(alumni.map((a) => a.batch))]
  .sort((a, b) => Number(b) - Number(a))
  .map((b) => ({ label: `Batch of ${b}`, value: b }));

const STREAM_OPTIONS = ["Science", "Commerce", "Arts"].map((s) => ({ label: s, value: s }));

const CITY_OPTIONS = [...new Set(alumni.map((a) => a.city))]
  .sort()
  .map((c) => ({ label: c, value: c }));

export default function AlumniPage() {
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [stream, setStream] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);

  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const query = search.trim().toLowerCase();
  const filtered = alumni.filter((a) => {
    const matchSearch =
      !query ||
      a.name.toLowerCase().includes(query) ||
      a.occupation.toLowerCase().includes(query) ||
      a.employer.toLowerCase().includes(query);
    return (
      matchSearch && (!batch || a.batch === batch) && (!stream || a.stream === stream) && (!city || a.city === city)
    );
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const mentors = alumni.filter((a) => a.mentor).length;
  const batches = new Set(alumni.map((a) => a.batch)).size;
  const cities = new Set(alumni.map((a) => a.city)).size;

  const columns: Column<Alumnus>[] = [
    {
      key: "name",
      header: "Alumnus",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{a.name}</p>
            <p className="truncate text-xs text-subtle">{a.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      sortable: true,
      render: (a) => <Badge variant="info">{a.batch}</Badge>,
    },
    {
      key: "stream",
      header: "Stream",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.stream}</span>,
    },
    {
      key: "occupation",
      header: "Current Occupation",
      sortable: true,
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{a.occupation}</p>
          <p className="truncate text-xs text-subtle">{a.employer}</p>
        </div>
      ),
    },
    {
      key: "city",
      header: "Location",
      sortable: true,
      render: (a) => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-muted">
          <MapPin className="size-3.5 text-subtle" />
          {a.city}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate text-muted">{a.email}</p>
          <p className="flex items-center gap-1 text-xs text-subtle">
            <Phone className="size-3" />
            {a.phone}
          </p>
        </div>
      ),
    },
    {
      key: "mentor",
      header: "Mentorship",
      sortable: true,
      sortValue: (a) => (a.mentor ? 1 : 0),
      render: (a) =>
        a.mentor ? (
          <Badge variant="success">Mentor</Badge>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Email alumnus"
            aria-label={`Email ${a.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Mail className="size-4" />
          </button>
          <button
            title="Invite to alumni meet"
            aria-label={`Invite ${a.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Send className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Alumni Directory"
        description="Stay connected with passed-out batches and their career journeys."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Send className="size-4" />
              Invite to Alumni Meet
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Alumni" value={alumni.length} icon={Users} tone="indigo" />
        <StatCard label="Batches Covered" value={batches} icon={Award} tone="violet" />
        <StatCard label="Cities" value={cities} icon={Briefcase} tone="cyan" />
        <StatCard label="Volunteer Mentors" value={mentors} icon={Award} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, occupation or employer…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search alumni"
          />
        </div>
        <div className="w-40">
          <Select
            value={batch}
            onChange={(e) => applyFilter(setBatch)(e.target.value)}
            placeholder="All batches"
            options={BATCH_OPTIONS}
            aria-label="Filter by batch"
          />
        </div>
        <div className="w-40">
          <Select
            value={stream}
            onChange={(e) => applyFilter(setStream)(e.target.value)}
            placeholder="All streams"
            options={STREAM_OPTIONS}
            aria-label="Filter by stream"
          />
        </div>
        <div className="w-40">
          <Select
            value={city}
            onChange={(e) => applyFilter(setCity)(e.target.value)}
            placeholder="All cities"
            options={CITY_OPTIONS}
            aria-label="Filter by city"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(a) => a.id}
        emptyTitle="No alumni found"
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
