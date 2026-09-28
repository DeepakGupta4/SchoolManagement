import { GraduationCap } from "lucide-react";
import { QrCode } from "@/components/cards/QrCode";
import { TODAY_ISO } from "@/lib/dates";
import {
  CERTIFICATE_DOC_META,
  CURRENT_SESSION,
  classLine,
  type Certificate,
} from "@/lib/api/certificates";

/** "14 July 2026" from an ISO date; falls back to the raw string if unparseable. */
function formatLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** The certifying sentence(s) for each type, built entirely from record data. */
function body(record: Certificate, schoolName: string) {
  const name = <span className="font-semibold underline">{record.student}</span>;
  const ward = record.fatherName ? <> Ward of <span className="font-semibold">{record.fatherName}</span>,</> : null;
  const where = classLine(record);
  const session = record.session || CURRENT_SESSION;
  const adm = record.admissionNo;
  const roll = record.rollNo ? <> and Roll No. <span className="font-semibold">{record.rollNo}</span></> : null;
  const dob =
    record.dob && !Number.isNaN(new Date(record.dob).getTime()) ? formatLong(record.dob) : null;

  switch (record.type) {
    case "Transfer":
      return (
        <>
          <p>
            This is to certify that {name},{ward} bearing Admission No.{" "}
            <span className="font-semibold">{adm}</span>{roll}, was a bonafide student of{" "}
            <span className="font-semibold">{schoolName}</span>, studying in{" "}
            <span className="font-semibold">{where}</span> during the academic session{" "}
            <span className="font-semibold">{session}</span>.
          </p>
          <p>
            The student has no dues pending against them and their conduct during their stay in the
            school was found to be satisfactory. This Transfer Certificate is{" "}
            {CERTIFICATE_DOC_META.Transfer.purpose}
          </p>
        </>
      );
    case "Character":
      return (
        <>
          <p>
            This is to certify that {name},{ward} bearing Admission No.{" "}
            <span className="font-semibold">{adm}</span>{roll}, was a student of{" "}
            <span className="font-semibold">{where}</span> at{" "}
            <span className="font-semibold">{schoolName}</span> during the academic session{" "}
            <span className="font-semibold">{session}</span>.
          </p>
          <p>
            To the best of our knowledge, the student bears a good moral character and their conduct
            throughout their association with the school has been found to be satisfactory. We wish
            them success in all their future endeavours.
          </p>
        </>
      );
    case "Migration":
      return (
        <>
          <p>
            This is to certify that {name},{ward} bearing Admission No.{" "}
            <span className="font-semibold">{adm}</span>{roll}, has left{" "}
            <span className="font-semibold">{where}</span> at{" "}
            <span className="font-semibold">{schoolName}</span> in the academic session{" "}
            <span className="font-semibold">{session}</span>.
          </p>
          <p>
            The student is hereby permitted to migrate to another recognised institution or board.
            This institution has no objection to their migration.
          </p>
        </>
      );
    case "Bonafide":
    default:
      return (
        <>
          <p>
            This is to certify that {name},{ward} bearing Admission No.{" "}
            <span className="font-semibold">{adm}</span>{roll}, is a bonafide student of{" "}
            <span className="font-semibold">{schoolName}</span>, currently studying in{" "}
            <span className="font-semibold">{where}</span> during the academic session{" "}
            <span className="font-semibold">{session}</span>.
            {dob ? (
              <> As per our records, the student&apos;s date of birth is <span className="font-semibold">{dob}</span>.</>
            ) : null}
          </p>
          <p>This certificate is {CERTIFICATE_DOC_META.Bonafide.purpose}</p>
        </>
      );
  }
}

/**
 * Printable certificate. Rendered inside a `hidden print:block` wrapper (or a
 * preview modal) — the global `@media print` rules show `.print-sheet` only, so
 * this is the sole thing that reaches paper. Colours are fixed so the sheet
 * looks identical regardless of the operator's theme.
 *
 * Every value is real record/school data — no hardcoded names, dates or lorem.
 */
export function CertificateDocument({
  record,
  schoolName,
  schoolAddress,
}: {
  record: Certificate;
  schoolName: string;
  schoolAddress?: string;
}) {
  const meta = CERTIFICATE_DOC_META[record.type];
  const issued = record.status === "issued";
  const date = formatLong(record.issueDate ?? TODAY_ISO);
  const session = record.session || CURRENT_SESSION;

  const details: [string, string][] = [
    ["Name", record.student],
    ...(record.fatherName ? ([["Guardian", record.fatherName]] as [string, string][]) : []),
    ["Class & Section", classLine(record)],
    ...(record.rollNo ? ([["Roll No.", record.rollNo]] as [string, string][]) : []),
    ["Admission No.", record.admissionNo],
    ["Session", session],
  ];

  return (
    <div className="print-sheet">
      <div className="mx-auto max-w-[720px] bg-white p-10 text-slate-900">
        {/* Header — school identity from the live profile */}
        <div className="flex items-center justify-center gap-3 border-b-[3px] border-double border-indigo-600 pb-4 text-center">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <GraduationCap className="size-7" />
          </div>
          <div className="leading-tight">
            <p className="text-xl font-bold uppercase tracking-wide text-indigo-700">{schoolName}</p>
            {schoolAddress ? <p className="mt-0.5 text-[11px] text-slate-500">{schoolAddress}</p> : null}
          </div>
        </div>

        <h2 className="mt-8 text-center text-lg font-bold uppercase tracking-[0.2em] text-slate-800">
          {meta.title}
        </h2>

        <div className="mt-5 flex justify-between text-sm">
          <span>
            <span className="font-semibold">Ref No:</span> {record.code}
          </span>
          <span>
            <span className="font-semibold">Date:</span> {date}
          </span>
        </div>

        {/* Body — certifying statement built from record data */}
        <div className="mt-6 space-y-4 text-[15px] leading-8 text-slate-800">
          {body(record, schoolName)}
        </div>

        {/* Particulars */}
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md bg-slate-50 p-4 text-[13px] ring-1 ring-slate-200">
          {details.map(([label, value]) => (
            <div key={label} className="flex gap-1.5">
              <dt className="shrink-0 font-semibold text-slate-500">{label}:</dt>
              <dd className="min-w-0 truncate font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Signatures + verification */}
        <div className="mt-16 flex items-end justify-between gap-4 text-sm">
          {issued && record.verificationCode ? (
            <div className="flex items-center gap-3">
              <QrCode value={record.verificationCode} className="size-16" />
              <div className="max-w-[9rem] text-[10px] leading-snug text-slate-500">
                Scan to verify online.
                <span className="mt-1 block font-mono font-semibold tracking-widest text-slate-700">
                  {record.verificationCode}
                </span>
              </div>
            </div>
          ) : (
            <p className="max-w-[10rem] text-[10px] leading-snug text-slate-400">
              A QR verification code will appear here once this certificate is issued.
            </p>
          )}

          <div className="flex gap-10 text-center">
            <div>
              <div className="h-px w-36 bg-slate-400" />
              <p className="mt-1 text-slate-600">Class Teacher</p>
            </div>
            <div>
              <div className="h-px w-36 bg-slate-400" />
              <p className="mt-1 text-slate-600">Principal</p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400">
          This is a computer-generated certificate issued by {schoolName}
          {issued && record.verificationCode
            ? ` · Verify online with code ${record.verificationCode}`
            : ""}
          .
        </p>
      </div>
    </div>
  );
}
