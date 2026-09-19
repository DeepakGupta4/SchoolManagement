import type { TransferRequest } from "@/lib/api/transfers";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/**
 * Printable Transfer / School-Leaving Certificate. Rendered inside a
 * `hidden print:block` wrapper on the page — invisible on screen, and the only
 * thing that prints (the global @media print rules show `.print-sheet` only).
 * Fixed colours so it looks identical regardless of the operator's theme.
 */
export function TransferCertificate({ record }: { record: TransferRequest }) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const typeLabel = record.type.charAt(0).toUpperCase() + record.type.slice(1);

  return (
    <div className="print-sheet">
      <div className="mx-auto max-w-[720px] bg-white p-10 text-slate-900">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-4 text-center">
          <h1 className="text-2xl font-extrabold uppercase tracking-wide text-indigo-700">Springdale School</h1>
          <p className="mt-1 text-xs text-slate-600">Mayur Vihar, New Delhi 110091 · CBSE Affiliation No. 2730123</p>
        </div>

        <h2 className="mt-8 text-center text-lg font-bold uppercase tracking-[0.2em] text-slate-800">
          {record.type === "withdrawal" ? "School Leaving Certificate" : "Transfer Certificate"}
        </h2>

        <div className="mt-6 flex justify-between text-sm">
          <span><span className="font-semibold">TC No:</span> {record.tcNo && record.tcNo !== "—" ? record.tcNo : "—"}</span>
          <span><span className="font-semibold">Date:</span> {record.issuedOn && record.issuedOn !== "—" ? record.issuedOn : today}</span>
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
          This is a computer-generated certificate issued by Springdale School.
        </p>
      </div>
    </div>
  );
}
