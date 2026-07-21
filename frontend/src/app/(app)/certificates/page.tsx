"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  Download,
  FileCheck2,
  FileText,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  XCircle,
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

const PAGE_SIZE = 8;

type CertificateType = "Transfer" | "Bonafide" | "Character" | "Migration";
type CertificateStatus = "pending" | "in-review" | "issued" | "rejected";

interface Certificate {
  id: string;
  student: string;
  admissionNo: string;
  className: string;
  type: CertificateType;
  requestedBy: string;
  requestedOn: string;
  issueDate: string | null;
  verificationCode: string | null;
  status: CertificateStatus;
}

const CERTIFICATES: Certificate[] = [
  {
    id: "CR-9001",
    student: "Aarav Deshpande",
    admissionNo: "ADM/2019/0412",
    className: "VI-B",
    type: "Bonafide",
    requestedBy: "Sunita Deshpande (Mother)",
    requestedOn: "2026-07-14",
    issueDate: "2026-07-16",
    verificationCode: "VC-8KD2-91XM",
    status: "issued",
  },
  {
    id: "CR-9002",
    student: "Ishita Kulkarni",
    admissionNo: "ADM/2016/0188",
    className: "X-A",
    type: "Transfer",
    requestedBy: "Ramesh Kulkarni (Father)",
    requestedOn: "2026-07-15",
    issueDate: null,
    verificationCode: null,
    status: "in-review",
  },
  {
    id: "CR-9003",
    student: "Mohammed Zaid Ansari",
    admissionNo: "ADM/2014/0071",
    className: "XII-B",
    type: "Migration",
    requestedBy: "Fatima Ansari (Mother)",
    requestedOn: "2026-07-10",
    issueDate: "2026-07-13",
    verificationCode: "VC-3PQ7-45LT",
    status: "issued",
  },
  {
    id: "CR-9004",
    student: "Nikhil Krishnan",
    admissionNo: "ADM/2017/0326",
    className: "IX-A",
    type: "Character",
    requestedBy: "Meera Krishnan (Mother)",
    requestedOn: "2026-07-18",
    issueDate: null,
    verificationCode: null,
    status: "pending",
  },
  {
    id: "CR-9005",
    student: "Ananya Iyer",
    admissionNo: "ADM/2015/0209",
    className: "XI-A",
    type: "Bonafide",
    requestedBy: "Self (Student)",
    requestedOn: "2026-07-17",
    issueDate: "2026-07-19",
    verificationCode: "VC-6RB1-38ZN",
    status: "issued",
  },
  {
    id: "CR-9006",
    student: "Rohan Pawar",
    admissionNo: "ADM/2018/0455",
    className: "VIII-C",
    type: "Transfer",
    requestedBy: "Santosh Pawar (Father)",
    requestedOn: "2026-07-09",
    issueDate: null,
    verificationCode: null,
    status: "rejected",
  },
  {
    id: "CR-9007",
    student: "Saanvi Bhatt",
    admissionNo: "ADM/2020/0533",
    className: "V-A",
    type: "Bonafide",
    requestedBy: "Neha Bhatt (Mother)",
    requestedOn: "2026-07-19",
    issueDate: null,
    verificationCode: null,
    status: "pending",
  },
  {
    id: "CR-9008",
    student: "Aditya Chaudhary",
    admissionNo: "ADM/2013/0044",
    className: "XII-A",
    type: "Migration",
    requestedBy: "Vikas Chaudhary (Father)",
    requestedOn: "2026-07-05",
    issueDate: "2026-07-08",
    verificationCode: "VC-9WT4-62KH",
    status: "issued",
  },
  {
    id: "CR-9009",
    student: "Zoya Ansari",
    admissionNo: "ADM/2021/0617",
    className: "IV-C",
    type: "Character",
    requestedBy: "Fatima Ansari (Mother)",
    requestedOn: "2026-07-16",
    issueDate: null,
    verificationCode: null,
    status: "in-review",
  },
  {
    id: "CR-9010",
    student: "Kabir Sethi",
    admissionNo: "ADM/2016/0271",
    className: "X-C",
    type: "Bonafide",
    requestedBy: "Anil Sethi (Father)",
    requestedOn: "2026-07-12",
    issueDate: "2026-07-14",
    verificationCode: "VC-1MF8-77QD",
    status: "issued",
  },
  {
    id: "CR-9011",
    student: "Diya Nair",
    admissionNo: "ADM/2015/0163",
    className: "XI-B",
    type: "Character",
    requestedBy: "Self (Student)",
    requestedOn: "2026-07-18",
    issueDate: null,
    verificationCode: null,
    status: "pending",
  },
  {
    id: "CR-9012",
    student: "Vihaan Gupta",
    admissionNo: "ADM/2019/0498",
    className: "VII-A",
    type: "Transfer",
    requestedBy: "Rekha Gupta (Mother)",
    requestedOn: "2026-07-07",
    issueDate: "2026-07-11",
    verificationCode: "VC-5NC3-20YR",
    status: "issued",
  },
  {
    id: "CR-9013",
    student: "Tanvi Joshi",
    admissionNo: "ADM/2017/0350",
    className: "IX-B",
    type: "Bonafide",
    requestedBy: "Prakash Joshi (Father)",
    requestedOn: "2026-07-20",
    issueDate: null,
    verificationCode: null,
    status: "pending",
  },
  {
    id: "CR-9014",
    student: "Arnav Reddy",
    admissionNo: "ADM/2014/0098",
    className: "XII-C",
    type: "Migration",
    requestedBy: "Sridhar Reddy (Father)",
    requestedOn: "2026-07-03",
    issueDate: "2026-07-06",
    verificationCode: "VC-7HG9-14BW",
    status: "issued",
  },
  {
    id: "CR-9015",
    student: "Myra Shaikh",
    admissionNo: "ADM/2020/0571",
    className: "V-B",
    type: "Character",
    requestedBy: "Imran Shaikh (Father)",
    requestedOn: "2026-07-11",
    issueDate: null,
    verificationCode: null,
    status: "rejected",
  },
  {
    id: "CR-9016",
    student: "Yash Wagh",
    admissionNo: "ADM/2018/0431",
    className: "VIII-A",
    type: "Bonafide",
    requestedBy: "Deepak Wagh (Father)",
    requestedOn: "2026-07-13",
    issueDate: "2026-07-15",
    verificationCode: "VC-4ZL6-89TP",
    status: "issued",
  },
  {
    id: "CR-9017",
    student: "Riya Menon",
    admissionNo: "ADM/2016/0244",
    className: "X-B",
    type: "Transfer",
    requestedBy: "Shobha Menon (Mother)",
    requestedOn: "2026-07-19",
    issueDate: null,
    verificationCode: null,
    status: "in-review",
  },
  {
    id: "CR-9018",
    student: "Kabir Singh Bedi",
    admissionNo: "ADM/2013/0022",
    className: "XII-A",
    type: "Character",
    requestedBy: "Gurpreet Singh (Father)",
    requestedOn: "2026-07-02",
    issueDate: "2026-07-04",
    verificationCode: "VC-2XV5-53JF",
    status: "issued",
  },
];

const TYPE_VARIANT: Record<CertificateType, "info" | "success" | "warning" | "default"> = {
  Transfer: "warning",
  Bonafide: "info",
  Character: "success",
  Migration: "default",
};

const STATUS_VARIANT: Record<CertificateStatus, "success" | "warning" | "info" | "danger"> = {
  pending: "warning",
  "in-review": "info",
  issued: "success",
  rejected: "danger",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function CertificatesPage() {
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
    return CERTIFICATES.filter((c) => {
      const matchesSearch =
        !q ||
        c.student.toLowerCase().includes(q) ||
        c.admissionNo.toLowerCase().includes(q) ||
        c.requestedBy.toLowerCase().includes(q) ||
        (c.verificationCode?.toLowerCase().includes(q) ?? false);
      const matchesType = !type || c.type === type;
      const matchesStatus = !status || c.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, type, status]);

  const stats = useMemo(() => {
    const issued = CERTIFICATES.filter((c) => c.status === "issued").length;
    const pending = CERTIFICATES.filter((c) => c.status === "pending").length;
    const inReview = CERTIFICATES.filter((c) => c.status === "in-review").length;
    const rejected = CERTIFICATES.filter((c) => c.status === "rejected").length;
    return { issued, pending, inReview, rejected };
  }, []);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const columns: Column<Certificate>[] = [
    {
      key: "student",
      header: "Student",
      sortable: true,
      sortValue: (c) => c.student,
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.student} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{c.student}</p>
            <p className="truncate text-xs text-subtle">
              {c.admissionNo} · {c.className}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Certificate",
      sortable: true,
      render: (c) => (
        <div className="min-w-0">
          <Badge variant={TYPE_VARIANT[c.type]}>{c.type}</Badge>
          <p className="mt-1 truncate text-xs text-subtle">{c.id}</p>
        </div>
      ),
    },
    {
      key: "requestedBy",
      header: "Requested by",
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate text-muted">{c.requestedBy}</p>
          <p className="mt-0.5 truncate text-xs text-subtle">on {formatDate(c.requestedOn)}</p>
        </div>
      ),
    },
    {
      key: "issueDate",
      header: "Issue date",
      sortable: true,
      sortValue: (c) => c.issueDate ?? "",
      render: (c) =>
        c.issueDate ? (
          <span className="whitespace-nowrap text-muted">{formatDate(c.issueDate)}</span>
        ) : (
          <span className="text-subtle">Not issued</span>
        ),
    },
    {
      key: "verificationCode",
      header: "Verification",
      render: (c) =>
        c.verificationCode ? (
          <Tooltip content="Scan the QR on the certificate to verify this code online">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm bg-surface-sunken px-2 py-1 text-xs font-medium tracking-widest text-muted">
              <QrCode className="size-3.5 text-subtle" />
              {c.verificationCode}
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
      render: (c) => (
        <Badge variant={STATUS_VARIANT[c.status]} className="capitalize">
          {c.status.replace("-", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) =>
        c.status === "issued" ? (
          <Button variant="outline" size="sm">
            <Download className="size-3.5" />
            PDF
          </Button>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Certificates"
        description="Issue transfer, bonafide, character and migration certificates with QR verification."
        actions={
          <>
            <Button variant="outline">
              <ShieldCheck className="size-4" />
              Verify a code
            </Button>
            <Button>
              <Plus className="size-4" />
              New request
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Issued" value={stats.issued} icon={FileCheck2} tone="emerald" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="In review" value={stats.inReview} icon={FileText} tone="indigo" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by student, admission no. or verification code…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search certificate requests"
          />
        </div>
        <div className="w-44">
          <Select
            value={type}
            onChange={(e) => applyFilter(setType)(e.target.value)}
            placeholder="All types"
            options={[
              { label: "Transfer", value: "Transfer" },
              { label: "Bonafide", value: "Bonafide" },
              { label: "Character", value: "Character" },
              { label: "Migration", value: "Migration" },
            ]}
            aria-label="Filter by certificate type"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Pending", value: "pending" },
              { label: "In review", value: "in-review" },
              { label: "Issued", value: "issued" },
              { label: "Rejected", value: "rejected" },
            ]}
            aria-label="Filter by status"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(c) => c.id}
        rowClassName={(c) => (c.status === "rejected" ? "opacity-60" : undefined)}
        emptyTitle="No certificate requests found"
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
