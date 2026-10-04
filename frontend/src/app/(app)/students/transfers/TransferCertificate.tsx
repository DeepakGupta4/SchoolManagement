import type { TransferRequest } from "@/lib/api/transfers";
import type { SchoolIdentity } from "@/lib/schoolIdentity";
import { TODAY_ISO } from "@/lib/dates";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-10-04" -> "4 October 2026"; returns the input unchanged if not an ISO date. */
function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-");
  const mi = Number(m) - 1;
  if (!y || !d || Number.isNaN(mi) || mi < 0 || mi > 11) return iso;
  return `${Number(d)} ${MONTHS[mi]} ${y}`;
}

/**
 * Printable Transfer / School-Leaving Certificate. Rendered inside a
 * `hidden print:block` wrapper on the page — invisible on screen, and the only
 * thing that prints (the global @media print rules show `.print-sheet` only).
 * Fixed colours so it looks identical regardless of the operator's theme.
 */
export function TransferCertificate({ record, school }: { record: TransferRequest; school?: SchoolIdentity }) {
  const today = formatLong(TODAY_ISO);
  const typeLabel = record.type.charAt(0).toUpperCase() + record.type.slice(1);

  return (
    <div className="print-sheet">
      <div className="mx-auto max-w-180 bg-white p-10 text-slate-900">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-4 text-center">
          <h1 className="text-2xl font-extrabold uppercase tracking-wide text-indigo-700">{school?.name || "Your School"}</h1>
          {(school?.addressLine || school?.affiliation) && (
            <p className="mt-1 text-xs text-slate-600">
              {[school?.addressLine, school?.affiliation].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <h2 className="mt-8 text-center text-lg font-bold uppercase tracking-[0.2em] text-slate-800">
          {record.type === "withdrawal" ? "School Leaving Certificate" : "Transfer Certificate"}
        </h2>

        <div className="mt-6 flex justify-between text-sm">
          <span><span className="font-semibold">TC No:</span> {record.tcNo && record.tcNo !== "—" ? record.tcNo : "—"}</span>
          <span><span className="font-semibold">Date:</span> {record.issuedOn && record.issuedOn !== "—" ? formatLong(record.issuedOn) : today}</span>
        </div>

        {/* Body */}
        <div className="mt-8 space-y-4 text-[15px] leading-8 text-slate-800">
          <p>
            This is to certify that <span className="font-semibold underline">{record.name}</span>
            {record.studentId ? <> (Student ID: <span className="font-semibold">{record.studentId}</span>)</> : null},
            a student of <span className="font-semibold">Class {record.className}</span> of this school, has been
            granted a <span className="font-semibold">{typeLabel}</span> at the request of the parent/guardian.
          </p>
          <p>
            <span className="font-semibold">Reason:</span> {record.reason || "—"}
          </p>
          <p>
            <span className="font-semibold">Dues status:</span>{" "}
            {record.dues > 0
              ? `Pending dues of ${inr.format(record.dues)} to be cleared.`
              : "All school dues have been cleared."}
          </p>
          <p>
            The conduct of the student during their stay in the school was satisfactory. We wish them
            success in their future endeavours.
          </p>
        </div>

        {/* Signatures */}
        <div className="mt-20 flex items-end justify-between text-sm">
          <div className="text-center">
            <div className="h-px w-40 bg-slate-400" />
            <p className="mt-1 text-slate-600">Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="h-px w-40 bg-slate-400" />
            <p className="mt-1 text-slate-600">Principal</p>
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] text-slate-400">
          This is a computer-generated certificate issued by {school?.name || "the school"}.
        </p>
      </div>
    </div>
  );
}
