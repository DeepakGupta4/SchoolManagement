"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileText,
  HardDrive,
  Library,
  NotebookPen,
  Search,
  Upload,
  Video,
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
  Tooltip,
  type Column,
} from "@/components/ui";

const PAGE_SIZE = 10;

const materials = [
  { id: "M01", title: "Quadratic Equations — Worksheet 4",  type: "pdf",   subject: "Mathematics",      klass: "X",    uploader: "Dr. Priya Sharma",  uploaded: "21 Jul 2026", sizeMb: 2.4,  downloads: 486, visibility: "published" },
  { id: "M02", title: "Wave Optics — Video Lecture 6",      type: "video", subject: "Physics",          klass: "XII",  uploader: "Mr. Rahul Verma",   uploaded: "20 Jul 2026", sizeMb: 184,  downloads: 312, visibility: "published" },
  { id: "M03", title: "The Monsoon — Model Essays",         type: "notes", subject: "English",          klass: "IX",   uploader: "Ms. Anita Patel",   uploaded: "20 Jul 2026", sizeMb: 1.1,  downloads: 528, visibility: "published" },
  { id: "M04", title: "Organic Chemistry — Alkanes Notes",  type: "notes", subject: "Chemistry",        klass: "XI",   uploader: "Ms. Kavita Singh",  uploaded: "19 Jul 2026", sizeMb: 3.8,  downloads: 274, visibility: "published" },
  { id: "M05", title: "Python Loops — Practice Set",        type: "pdf",   subject: "Computer Science", klass: "X",    uploader: "Mr. Amit Joshi",    uploaded: "19 Jul 2026", sizeMb: 1.7,  downloads: 391, visibility: "published" },
  { id: "M06", title: "Genetics — Mendel's Laws Recording", type: "video", subject: "Biology",          klass: "XII",  uploader: "Ms. Deepa Nair",    uploaded: "18 Jul 2026", sizeMb: 226,  downloads: 198, visibility: "published" },
  { id: "M07", title: "Mughal Empire — Chapter Summary",    type: "notes", subject: "History",          klass: "IX",   uploader: "Mr. Suresh Kumar",  uploaded: "18 Jul 2026", sizeMb: 0.9,  downloads: 415, visibility: "published" },
  { id: "M08", title: "Hindi Sandhi — Abhyas Patra",        type: "pdf",   subject: "Hindi",            klass: "VII",  uploader: "Ms. Meenakshi Rao", uploaded: "17 Jul 2026", sizeMb: 1.3,  downloads: 462, visibility: "published" },
  { id: "M09", title: "Ledger Posting — Solved Examples",   type: "pdf",   subject: "Accountancy",      klass: "XII",  uploader: "Ms. Ritu Bansal",   uploaded: "17 Jul 2026", sizeMb: 2.9,  downloads: 176, visibility: "published" },
  { id: "M10", title: "Trigonometry — Formula Sheet",       type: "notes", subject: "Mathematics",      klass: "X",    uploader: "Mr. Rakesh Yadav",  uploaded: "16 Jul 2026", sizeMb: 0.6,  downloads: 604, visibility: "published" },
  { id: "M11", title: "Thermodynamics — Numericals",        type: "pdf",   subject: "Physics",          klass: "XI",   uploader: "Mr. Rahul Verma",   uploaded: "16 Jul 2026", sizeMb: 2.2,  downloads: 243, visibility: "published" },
  { id: "M12", title: "French Greetings — Audio Notes",     type: "video", subject: "French",           klass: "XI",   uploader: "Ms. Elena D'Souza", uploaded: "15 Jul 2026", sizeMb: 96,   downloads: 68,  visibility: "published" },
  { id: "M13", title: "Cell Structure — Labelled Diagrams", type: "pdf",   subject: "Biology",          klass: "XI",   uploader: "Ms. Deepa Nair",    uploaded: "15 Jul 2026", sizeMb: 5.4,  downloads: 289, visibility: "published" },
  { id: "M14", title: "Sanskrit Shloka — Recitation Guide", type: "notes", subject: "Sanskrit",         klass: "VIII", uploader: "Ms. Lata Trivedi",  uploaded: "14 Jul 2026", sizeMb: 0.8,  downloads: 121, visibility: "draft"     },
  { id: "M15", title: "Robotics — Sensor Basics Slides",    type: "pdf",   subject: "Electronics",      klass: "IX",   uploader: "Mr. Naveen Chawla", uploaded: "14 Jul 2026", sizeMb: 8.6,  downloads: 54,  visibility: "draft"     },
  { id: "M16", title: "Business Studies — Case Studies",    type: "notes", subject: "Accountancy",      klass: "XII",  uploader: "Ms. Ritu Bansal",   uploaded: "13 Jul 2026", sizeMb: 2.1,  downloads: 137, visibility: "published" },
  { id: "M17", title: "Algebra Revision — Whiteboard Clip", type: "video", subject: "Mathematics",      klass: "IX",   uploader: "Mr. Rakesh Yadav",  uploaded: "12 Jul 2026", sizeMb: 143,  downloads: 205, visibility: "published" },
  { id: "M18", title: "Civics — Constitution Handout",      type: "pdf",   subject: "History",          klass: "IX",   uploader: "Mr. Suresh Kumar",  uploaded: "12 Jul 2026", sizeMb: 1.9,  downloads: 348, visibility: "published" },
];

type Material = (typeof materials)[number];

const TYPE_META: Record<
  string,
  { label: string; icon: typeof FileText; variant: "danger" | "info" | "warning"; tile: string }
> = {
  pdf: { label: "PDF", icon: FileText, variant: "danger", tile: "gradient-rose" },
  video: { label: "Video", icon: Video, variant: "info", tile: "gradient-cyan" },
  notes: { label: "Notes", icon: NotebookPen, variant: "warning", tile: "gradient-amber" },
};

const SUBJECT_OPTIONS = [...new Set(materials.map((m) => m.subject))]
  .sort()
  .map((s) => ({ label: s, value: s }));

const CLASS_OPTIONS = [...new Set(materials.map((m) => m.klass))].map((c) => ({
  label: `Class ${c}`,
  value: c,
}));

const formatSize = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`);

export default function StudyMaterialPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [klass, setKlass] = useState("");
  const [page, setPage] = useState(1);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials.filter((m) => {
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.uploader.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (!type || m.type === type) &&
        (!subject || m.subject === subject) &&
        (!klass || m.klass === klass)
      );
    });
  }, [search, type, subject, klass]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const stats = useMemo(() => {
    const downloads = materials.reduce((sum, m) => sum + m.downloads, 0);
    const storage = materials.reduce((sum, m) => sum + m.sizeMb, 0);
    const videos = materials.filter((m) => m.type === "video").length;
    return {
      files: materials.length,
      downloads,
      storage: (storage / 1024).toFixed(2),
      videos,
    };
  }, []);

  const columns: Column<Material>[] = [
    {
      key: "title",
      header: "Material",
      sortable: true,
      render: (m) => {
        const meta = TYPE_META[m.type];
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-md text-white ${meta.tile}`}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{m.title}</p>
              <p className="truncate text-xs text-subtle">{formatSize(m.sizeMb)}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (m) => <Badge variant={TYPE_META[m.type].variant}>{TYPE_META[m.type].label}</Badge>,
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (m) => <span className="whitespace-nowrap text-muted">{m.subject}</span>,
    },
    {
      key: "klass",
      header: "Class",
      sortable: true,
      render: (m) => (
        <span className="inline-flex items-center rounded-sm border border-border bg-surface-sunken px-1.5 py-0.5 text-xs font-medium text-muted">
          {m.klass}
        </span>
      ),
    },
    {
      key: "uploader",
      header: "Uploaded by",
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={m.uploader} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-text">{m.uploader}</p>
            <p className="truncate text-xs text-subtle">{m.uploaded}</p>
          </div>
        </div>
      ),
    },
    {
      key: "downloads",
      header: "Downloads",
      sortable: true,
      align: "right",
      render: (m) => <span className="font-medium text-text">{m.downloads}</span>,
    },
    {
      key: "visibility",
      header: "Visibility",
      sortable: true,
      render: (m) => (
        <Badge variant={m.visibility === "published" ? "success" : "default"} className="capitalize">
          {m.visibility}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <Tooltip content={`Download ${m.title}`} side="left">
          <button
            aria-label={`Download ${m.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Download className="size-4" />
          </button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Study material"
        description="Shared library of PDFs, recorded lectures and class notes."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Bulk download
            </Button>
            <Button>
              <Upload className="size-4" />
              Upload material
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Files in library" value={stats.files} icon={Library} tone="indigo" />
        <StatCard label="Total downloads" value={stats.downloads} icon={Download} tone="emerald" trend={14} />
        <StatCard label="Video lectures" value={stats.videos} icon={Video} tone="cyan" />
        <StatCard label="Storage used" value={stats.storage} suffix=" GB" icon={HardDrive} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by title, subject or uploader…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search study material"
          />
        </div>
        <div className="w-40">
          <Select
            value={type}
            onChange={(e) => applyFilter(setType)(e.target.value)}
            placeholder="All types"
            options={[
              { label: "PDF", value: "pdf" },
              { label: "Video", value: "video" },
              { label: "Notes", value: "notes" },
            ]}
            aria-label="Filter by type"
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
        <div className="w-40">
          <Select
            value={klass}
            onChange={(e) => applyFilter(setKlass)(e.target.value)}
            placeholder="All classes"
            options={CLASS_OPTIONS}
            aria-label="Filter by class"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(m) => m.id}
        rowClassName={(m) => (m.visibility === "draft" ? "opacity-70" : undefined)}
        emptyTitle="No material found"
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
