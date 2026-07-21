"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  DoorOpen,
  LogIn,
  QrCode,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  Textarea,
  Tooltip,
  useToast,
  type Column,
} from "@/components/ui";

const PAGE_SIZE = 8;

type VisitorPurpose =
  | "Parent meeting"
  | "Admission enquiry"
  | "Vendor / delivery"
  | "Maintenance"
  | "Student pickup"
  | "Official inspection";

type VisitorStatus = "inside" | "checked-out" | "expected";

interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: VisitorPurpose;
  whomToMeet: string;
  inTime: string;
  outTime: string | null;
  passCode: string;
  status: VisitorStatus;
  /** Set when the visitor is authorised to collect a student at the gate. */
  pickupFor: string | null;
}

const PURPOSE_OPTIONS: VisitorPurpose[] = [
  "Parent meeting",
  "Admission enquiry",
  "Vendor / delivery",
  "Maintenance",
  "Student pickup",
  "Official inspection",
];

const VISITORS: Visitor[] = [
  {
    id: "VS-5001",
    name: "Ramesh Kulkarni",
    phone: "+91 98220 41277",
    purpose: "Parent meeting",
    whomToMeet: "Meenakshi Iyer (Class Teacher, VIII-A)",
    inTime: "09:12",
    outTime: "10:05",
    passCode: "GP-4A19KD",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "VS-5002",
    name: "Sunita Deshpande",
    phone: "+91 99700 33812",
    purpose: "Student pickup",
    whomToMeet: "Gate Security Desk",
    inTime: "13:40",
    outTime: "13:58",
    passCode: "GP-7X02LM",
    status: "checked-out",
    pickupFor: "Aarav Deshpande (VI-B)",
  },
  {
    id: "VS-5003",
    name: "Imran Shaikh",
    phone: "+91 90280 55491",
    purpose: "Vendor / delivery",
    whomToMeet: "Stores Department",
    inTime: "10:22",
    outTime: null,
    passCode: "GP-2M84QP",
    status: "inside",
    pickupFor: null,
  },
  {
    id: "VS-5004",
    name: "Dr. Anita Rao",
    phone: "+91 98450 71203",
    purpose: "Official inspection",
    whomToMeet: "Principal's Office",
    inTime: "11:05",
    outTime: null,
    passCode: "GP-9F51TR",
    status: "inside",
    pickupFor: null,
  },
  {
    id: "VS-5005",
    name: "Vikas Chaudhary",
    phone: "+91 87930 22106",
    purpose: "Admission enquiry",
    whomToMeet: "Admissions Counter",
    inTime: "09:48",
    outTime: "10:36",
    passCode: "GP-6C37VN",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "VS-5006",
    name: "Lakshmi Narayanan",
    phone: "+91 96320 88014",
    purpose: "Parent meeting",
    whomToMeet: "Priya Ramanathan (HOD Mathematics)",
    inTime: "12:15",
    outTime: null,
    passCode: "GP-1B60WS",
    status: "inside",
    pickupFor: null,
  },
  {
    id: "VS-5007",
    name: "Prakash Jadhav",
    phone: "+91 91580 46722",
    purpose: "Maintenance",
    whomToMeet: "Facilities Manager",
    inTime: "08:30",
    outTime: "14:10",
    passCode: "GP-3H29YU",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "VS-5008",
    name: "Fatima Ansari",
    phone: "+91 99870 13455",
    purpose: "Student pickup",
    whomToMeet: "Gate Security Desk",
    inTime: "14:02",
    outTime: null,
    passCode: "GP-8K73ZA",
    status: "inside",
    pickupFor: "Zoya Ansari (IV-C)",
  },
  {
    id: "VS-5009",
    name: "Gurpreet Singh",
    phone: "+91 98110 60934",
    purpose: "Vendor / delivery",
    whomToMeet: "Canteen Supervisor",
    inTime: "07:55",
    outTime: "08:40",
    passCode: "GP-5N18EQ",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "VS-5010",
    name: "Neha Bhatt",
    phone: "+91 97640 29587",
    purpose: "Admission enquiry",
    whomToMeet: "Admissions Counter",
    inTime: "15:20",
    outTime: null,
    passCode: "GP-0J45RB",
    status: "expected",
    pickupFor: null,
  },
  {
    id: "VS-5011",
    name: "Santosh Pawar",
    phone: "+91 94220 77340",
    purpose: "Parent meeting",
    whomToMeet: "Rajesh Nair (Sports Head)",
    inTime: "11:48",
    outTime: "12:22",
    passCode: "GP-4T91CX",
    status: "checked-out",
    pickupFor: null,
  },
  {
    id: "VS-5012",
    name: "Meera Krishnan",
    phone: "+91 98404 51166",
    purpose: "Student pickup",
    whomToMeet: "Gate Security Desk",
    inTime: "15:05",
    outTime: null,
    passCode: "GP-7Q26DF",
    status: "inside",
    pickupFor: "Nikhil Krishnan (IX-A)",
  },
  {
    id: "VS-5013",
    name: "Abdul Rehman",
    phone: "+91 90040 38729",
    purpose: "Maintenance",
    whomToMeet: "IT Support (Computer Lab)",
    inTime: "10:50",
    outTime: null,
    passCode: "GP-2W83GH",
    status: "inside",
    pickupFor: null,
  },
  {
    id: "VS-5014",
    name: "Jyoti Sharma",
    phone: "+91 99530 64218",
    purpose: "Official inspection",
    whomToMeet: "Vice Principal",
    inTime: "16:00",
    outTime: null,
    passCode: "GP-6L07JK",
    status: "expected",
    pickupFor: null,
  },
  {
    id: "VS-5015",
    name: "Deepak Wagh",
    phone: "+91 88880 92451",
    purpose: "Vendor / delivery",
    whomToMeet: "Library Desk",
    inTime: "09:05",
    outTime: "09:31",
    passCode: "GP-3Z54MN",
    status: "checked-out",
    pickupFor: null,
  },
];

const STATUS_VARIANT: Record<VisitorStatus, "success" | "default" | "warning"> = {
  inside: "success",
  "checked-out": "default",
  expected: "warning",
};

const PURPOSE_VARIANT: Record<VisitorPurpose, "info" | "warning" | "danger" | "default"> = {
  "Parent meeting": "info",
  "Admission enquiry": "info",
  "Vendor / delivery": "default",
  Maintenance: "default",
  "Student pickup": "warning",
  "Official inspection": "danger",
};

const currentTime = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

const makePassCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `GP-${code}`;
};

const EMPTY_FORM = { name: "", phone: "", purpose: "", whomToMeet: "", notes: "" };

export default function VisitorsPage() {
  const { toast } = useToast();

  const [visitors, setVisitors] = useState<Visitor[]>(VISITORS);
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showErrors, setShowErrors] = useState(false);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const setField = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visitors.filter((v) => {
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.phone.toLowerCase().includes(q) ||
        v.whomToMeet.toLowerCase().includes(q) ||
        v.passCode.toLowerCase().includes(q);
      const matchesPurpose = !purpose || v.purpose === purpose;
      const matchesStatus = !status || v.status === status;
      return matchesSearch && matchesPurpose && matchesStatus;
    });
  }, [visitors, search, purpose, status]);

  const stats = useMemo(() => {
    const inside = visitors.filter((v) => v.status === "inside").length;
    const expected = visitors.filter((v) => v.status === "expected").length;
    const pickups = visitors.filter((v) => v.pickupFor).length;
    return { total: visitors.length, inside, expected, pickups };
  }, [visitors]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const openCheckIn = () => {
    setForm(EMPTY_FORM);
    setShowErrors(false);
    setCheckInOpen(true);
  };

  const handleCheckIn = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.purpose || !form.whomToMeet.trim()) {
      setShowErrors(true);
      return;
    }

    const entry: Visitor = {
      id: `VS-${5016 + visitors.length}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      purpose: form.purpose as VisitorPurpose,
      whomToMeet: form.whomToMeet.trim(),
      inTime: currentTime(),
      outTime: null,
      passCode: makePassCode(),
      status: "inside",
      pickupFor: form.purpose === "Student pickup" ? form.notes.trim() || "Pending verification" : null,
    };

    setVisitors((prev) => [entry, ...prev]);
    setCheckInOpen(false);
    setPage(1);
    toast({
      title: "Visitor checked in",
      description: `${entry.name} was issued gate pass ${entry.passCode}.`,
    });
  };

  const checkOut = (visitor: Visitor) => {
    setVisitors((prev) =>
      prev.map((v) =>
        v.id === visitor.id ? { ...v, status: "checked-out", outTime: currentTime() } : v
      )
    );
    toast({ title: "Visitor checked out", description: `${visitor.name} has left the premises.` });
  };

  const columns: Column<Visitor>[] = [
    {
      key: "name",
      header: "Visitor",
      sortable: true,
      sortValue: (v) => v.name,
      render: (v) => (
        <div className="flex items-center gap-3">
          <Avatar name={v.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{v.name}</p>
            <p className="truncate text-xs text-subtle">{v.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "purpose",
      header: "Purpose",
      sortable: true,
      render: (v) => <Badge variant={PURPOSE_VARIANT[v.purpose]}>{v.purpose}</Badge>,
    },
    {
      key: "whomToMeet",
      header: "Whom to meet",
      render: (v) => (
        <div className="min-w-0">
          <p className="truncate text-muted">{v.whomToMeet}</p>
          {v.pickupFor && (
            <p className="mt-0.5 inline-flex items-center gap-1 truncate text-xs text-warning-text">
              <ShieldCheck className="size-3 shrink-0" />
              Pickup: {v.pickupFor}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "inTime",
      header: "In / Out",
      sortable: true,
      render: (v) => (
        <span className="whitespace-nowrap text-muted">
          {v.inTime} — {v.outTime ?? <span className="text-subtle">still inside</span>}
        </span>
      ),
    },
    {
      key: "passCode",
      header: "Gate pass",
      render: (v) => (
        <Tooltip content="Scan this code at the gate to verify the pass">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm bg-surface-sunken px-2 py-1 text-xs font-medium tracking-widest text-muted">
            <QrCode className="size-3.5 text-subtle" />
            {v.passCode}
          </span>
        </Tooltip>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (v) => (
        <Badge variant={STATUS_VARIANT[v.status]} className="capitalize">
          {v.status.replace("-", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (v) =>
        v.status === "inside" ? (
          <Button variant="outline" size="sm" onClick={() => checkOut(v)}>
            <DoorOpen className="size-3.5" />
            Check out
          </Button>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Visitors & gate"
        description="Log every visitor, issue QR gate passes and authorise student pickups."
        actions={
          <>
            <Button variant="outline">
              <QrCode className="size-4" />
              Scan pass
            </Button>
            <Button onClick={openCheckIn}>
              <UserPlus className="size-4" />
              Check in visitor
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visitors today" value={stats.total} icon={Users} tone="indigo" />
        <StatCard label="Currently inside" value={stats.inside} icon={LogIn} tone="emerald" />
        <StatCard label="Expected" value={stats.expected} icon={BadgeCheck} tone="amber" />
        <StatCard label="Student pickups" value={stats.pickups} icon={ShieldCheck} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, phone, host or pass code…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search visitors"
          />
        </div>
        <div className="w-52">
          <Select
            value={purpose}
            onChange={(e) => applyFilter(setPurpose)(e.target.value)}
            placeholder="All purposes"
            options={PURPOSE_OPTIONS.map((p) => ({ label: p, value: p }))}
            aria-label="Filter by purpose"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Inside", value: "inside" },
              { label: "Checked out", value: "checked-out" },
              { label: "Expected", value: "expected" },
            ]}
            aria-label="Filter by status"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(v) => v.id}
        rowClassName={(v) => (v.status === "checked-out" ? "opacity-70" : undefined)}
        emptyTitle="No visitors found"
        emptyDescription="Try clearing your filters, or check in a new visitor at the gate."
        emptyAction={
          <Button variant="outline" onClick={openCheckIn}>
            <UserPlus className="size-4" />
            Check in visitor
          </Button>
        }
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />

      <Modal
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        title="Check in visitor"
        description="A QR gate pass is generated automatically once the entry is saved."
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setCheckInOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="visitor-check-in-form">
              <UserPlus className="size-4" />
              Issue gate pass
            </Button>
          </>
        }
      >
        <form id="visitor-check-in-form" onSubmit={handleCheckIn} className="flex flex-col gap-4">
          <Input
            label="Full name"
            required
            placeholder="e.g. Ramesh Kulkarni"
            value={form.name}
            onChange={(e) => setField("name")(e.target.value)}
            error={showErrors && !form.name.trim() ? "Visitor name is required." : undefined}
          />
          <Input
            label="Phone number"
            required
            type="tel"
            placeholder="+91 98220 41277"
            value={form.phone}
            onChange={(e) => setField("phone")(e.target.value)}
            error={showErrors && !form.phone.trim() ? "Phone number is required." : undefined}
          />
          <Select
            label="Purpose of visit"
            required
            placeholder="Select a purpose"
            value={form.purpose}
            onChange={(e) => setField("purpose")(e.target.value)}
            options={PURPOSE_OPTIONS.map((p) => ({ label: p, value: p }))}
            error={showErrors && !form.purpose ? "Select the purpose of the visit." : undefined}
          />
          <Input
            label="Whom to meet"
            required
            placeholder="e.g. Meenakshi Iyer (Class Teacher, VIII-A)"
            value={form.whomToMeet}
            onChange={(e) => setField("whomToMeet")(e.target.value)}
            error={showErrors && !form.whomToMeet.trim() ? "Enter the host or department." : undefined}
          />
          <Textarea
            label="Notes"
            placeholder="For student pickup, enter the student name and class."
            hint="Optional — recorded against the gate pass."
            value={form.notes}
            onChange={(e) => setField("notes")(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
