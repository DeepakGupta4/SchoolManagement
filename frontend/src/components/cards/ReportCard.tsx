"use client";

import { GraduationCap } from "lucide-react";
import { PhotoFrame } from "./PhotoFrame";
import { QrCode } from "./QrCode";

export interface ReportCardSubject {
  subject: string;
  maxMarks: number;
  obtained: number;
}

export interface ReportCardData {
  studentName: string;
  admissionNo: string;
  rollNo: string | number;
  className: string;
  section: string;
  fatherName: string;
  session: string;
  examName: string;
  photo?: string;
  subjects: ReportCardSubject[];
  attendancePercent: number;
  rank: number;
  classSize: number;
}

function grade(pct: number): { label: string; remark: string } {
  if (pct >= 90) return { label: "A+", remark: "Outstanding" };
  if (pct >= 80) return { label: "A", remark: "Excellent" };
  if (pct >= 70) return { label: "B+", remark: "Very Good" };
  if (pct >= 60) return { label: "B", remark: "Good" };
  if (pct >= 50) return { label: "C", remark: "Satisfactory" };
  if (pct >= 33) return { label: "D", remark: "Needs Improvement" };
  return { label: "E", remark: "Unsatisfactory" };
}

/** Rule-based remark — transparent, not an AI model. */
function principalRemark(pct: number, attendance: number, name: string): string {
  const first = name.split(" ")[0];
  if (pct >= 85 && attendance >= 90)
    return `${first} has performed exceptionally well this term with consistent attendance. Keep up the excellent work.`;
  if (pct >= 60)
    return `${first} has shown steady progress. With a little more focus on weaker subjects, even better results are within reach.`;
  if (attendance < 75)
    return `${first}'s attendance is below the required minimum, which is affecting performance. Regular attendance is strongly advised.`;
  return `${first} needs to put in more consistent effort. A meeting with the class teacher is recommended to plan support.`;
}

const inr0 = (n: number) => n.toLocaleString("en-IN");

/**
 * Term report card at A4 portrait proportions (210 × 297 mm ≈ 1:1.414).
 *
 * Colours are fixed rather than themed — a printed report card must look
 * identical regardless of the operator's light/dark preference.
 */
export function ReportCard({ data }: { data: ReportCardData }) {
  const totalMax = data.subjects.reduce((s, x) => s + x.maxMarks, 0);
  const totalObtained = data.subjects.reduce((s, x) => s + x.obtained, 0);
  const pct = totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;
  const overall = grade(pct);

  return (
    <div
      className="report-card flex w-full flex-col overflow-hidden rounded-lg bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
      style={{ aspectRatio: "1 / 1.414" }}
    >
      {/* Masthead */}
      <div className="shrink-0 border-b-[3px] border-double border-indigo-600 px-6 pt-5 pb-3">
        <div className="flex items-center justify-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <GraduationCap className="size-7" />
          </div>
          <div className="text-center leading-tight">
            <p className="text-lg font-bold uppercase tracking-wide">Springdale School</p>
            <p className="text-[10px] text-slate-500">
              Mayur Vihar, New Delhi 110091 · CBSE Affiliation No. 2730123
            </p>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-700">
          Report Card · {data.examName}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-6">
        {/* Student header */}
        <div className="flex gap-4">
          <PhotoFrame src={data.photo} name={data.studentName} className="w-16 shrink-0" />
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5 self-center text-[11px]">
            {[
              ["Name", data.studentName],
              ["Father's Name", data.fatherName],
              ["Class & Section", `${data.className} · ${data.section}`],
              ["Roll No.", String(data.rollNo)],
              ["Admission No.", data.admissionNo],
              ["Session", data.session],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-1.5">
                <dt className="shrink-0 font-semibold text-slate-500">{label}:</dt>
                <dd className="truncate font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Marks table */}
        <div className="overflow-hidden rounded-md ring-1 ring-slate-200">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="px-3 py-2 text-left font-semibold">Subject</th>
                <th className="px-3 py-2 text-right font-semibold">Max</th>
                <th className="px-3 py-2 text-right font-semibold">Obtained</th>
                <th className="px-3 py-2 text-center font-semibold">Grade</th>
                <th className="px-3 py-2 text-left font-semibold">Remark</th>
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((s, i) => {
                const sp = s.maxMarks ? Math.round((s.obtained / s.maxMarks) * 100) : 0;
                const g = grade(sp);
                return (
                  <tr key={s.subject} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                    <td className="px-3 py-1.5 font-medium">{s.subject}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{s.maxMarks}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold">{s.obtained}</td>
                    <td className="px-3 py-1.5 text-center font-bold">{g.label}</td>
                    <td className="px-3 py-1.5 text-slate-600">{g.remark}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-indigo-50 font-bold">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right font-mono">{inr0(totalMax)}</td>
                <td className="px-3 py-2 text-right font-mono text-indigo-700">{inr0(totalObtained)}</td>
                <td className="px-3 py-2 text-center text-indigo-700">{overall.label}</td>
                <td className="px-3 py-2 text-indigo-700">{pct}%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Result strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            ["Percentage", `${pct}%`],
            ["Grade", overall.label],
            ["Rank", `${data.rank} / ${data.classSize}`],
            ["Attendance", `${data.attendancePercent}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-slate-50 px-3 py-2 text-center ring-1 ring-slate-200">
              <p className="text-base font-bold text-indigo-700">{value}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Remark */}
        <div className="rounded-md bg-indigo-50/60 px-4 py-3">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Class Teacher&apos;s Remark
          </p>
          <p className="text-[11px] leading-relaxed text-slate-700">
            {principalRemark(pct, data.attendancePercent, data.studentName)}
          </p>
        </div>

        {/* Grade scale */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] text-slate-500">
          <span className="font-semibold uppercase tracking-wide">Grading:</span>
          {[
            "A+ (90-100)", "A (80-89)", "B+ (70-79)", "B (60-69)",
            "C (50-59)", "D (33-49)", "E (<33)",
          ].map((g) => (
            <span key={g}>{g}</span>
          ))}
        </div>

        {/* Signatures + QR */}
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div className="flex items-center gap-3">
            <QrCode value={`${data.admissionNo}|${data.examName}|${pct}`} className="size-12" />
            <p className="max-w-[7rem] text-[8px] leading-snug text-slate-500">
              Scan to verify this report card online.
            </p>
          </div>
          <div className="flex gap-8 text-center text-[9px] text-slate-500">
            {["Class Teacher", "Principal"].map((role) => (
              <div key={role}>
                <div className="mb-1 h-7 w-24 border-b border-slate-400" />
                {role}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
