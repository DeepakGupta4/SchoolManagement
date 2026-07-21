import { createResource, textMatch } from "./createResource";

export type CertificateType = "Transfer" | "Bonafide" | "Character" | "Migration";
export type CertificateStatus = "pending" | "in-review" | "issued" | "rejected";

export interface Certificate {
  id: string;
  /** Human-facing reference shown in the UI, e.g. "CR-9001". The `id` is
   *  internal and must never be displayed. */
  code: string;
  student: string;
  admissionNo: string;
  className: string;
  type: CertificateType;
  requestedBy: string;
  /** ISO date, e.g. "2026-07-14". */
  requestedOn: string;
  issueDate: string | null;
  verificationCode: string | null;
  status: CertificateStatus;
}

export interface CertificateFilters {
  search?: string;
  type?: string;
  status?: string;
}

export const CERTIFICATE_TYPE_OPTIONS: { label: string; value: CertificateType }[] = [
  { label: "Transfer", value: "Transfer" },
  { label: "Bonafide", value: "Bonafide" },
  { label: "Character", value: "Character" },
  { label: "Migration", value: "Migration" },
];

export const CERTIFICATE_STATUS_OPTIONS: { label: string; value: CertificateStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "In review", value: "in-review" },
  { label: "Issued", value: "issued" },
  { label: "Rejected", value: "rejected" },
];

/** "2026-07-21" — the ISO form every certificate date is stored in. */
export const todayIso = () => new Date().toISOString().slice(0, 10);

/** "VC-8KD2-91XM" — printed under the QR code on the issued certificate. */
export const makeVerificationCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  const block = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `VC-${block(4)}-${block(4)}`;
};

const seed: Certificate[] = [
  {
    id: "crt_001",
    code: "CR-9001",
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
    id: "crt_002",
    code: "CR-9002",
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
    id: "crt_003",
    code: "CR-9003",
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
    id: "crt_004",
    code: "CR-9004",
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
    id: "crt_005",
    code: "CR-9005",
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
    id: "crt_006",
    code: "CR-9006",
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
    id: "crt_007",
    code: "CR-9007",
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
    id: "crt_008",
    code: "CR-9008",
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
    id: "crt_009",
    code: "CR-9009",
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
    id: "crt_010",
    code: "CR-9010",
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
    id: "crt_011",
    code: "CR-9011",
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
    id: "crt_012",
    code: "CR-9012",
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
    id: "crt_013",
    code: "CR-9013",
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
    id: "crt_014",
    code: "CR-9014",
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
    id: "crt_015",
    code: "CR-9015",
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
    id: "crt_016",
    code: "CR-9016",
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
    id: "crt_017",
    code: "CR-9017",
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
    id: "crt_018",
    code: "CR-9018",
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

export const certificatesApi = createResource<Certificate, CertificateFilters, "code">({
  idPrefix: "crt",
  seed,
  uniqueBy: { field: "code", label: "Certificate code" },
  // Reference numbers continue the seed sequence rather than restarting.
  generate: (count) => ({ code: `CR-${9000 + count + 1}` }),
  defaults: { status: "pending", issueDate: null, verificationCode: null },
  matches: (row, { search, type, status }) => {
    if (type && row.type !== type) return false;
    if (status && row.status !== status) return false;
    return textMatch(
      search,
      row.student,
      row.admissionNo,
      row.requestedBy,
      row.verificationCode ?? ""
    );
  },
});
