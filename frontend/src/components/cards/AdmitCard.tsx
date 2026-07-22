"use client";

import { GraduationCap } from "lucide-react";
import { PhotoFrame } from "./PhotoFrame";
import { QrCode } from "./QrCode";

export interface AdmitCardSubject {
  subject: string;
  date: string;
  day: string;
  timing: string;
  room: string;
}

export interface AdmitCardData {
  id: string;
  studentName: string;
  rollNo: string;
  admissionNo: string;
  className: string;
  section: string;
  examName: string;
  session: string;
  centreCode: string;
  centreName: string;
  fatherName: string;
  photo?: string;
  subjects: AdmitCardSubject[];
}

const INSTRUCTIONS = [
  "Candidates must carry this admit card to every examination session.",
  "Report to the examination hall 30 minutes before the scheduled time.",
  "Electronic devices, including mobile phones and smart watches, are prohibited.",
  "Use of unfair means will lead to immediate cancellation of the paper.",
  "This admit card is invalid without the principal's signature and school seal.",
];

/**
 * Exam admit card in A5 portrait proportions (148 × 210 mm ≈ 1:1.414).
 *
 * Like IdCard, colours are fixed rather than themed — the printed artefact
 * must not change with the operator's light/dark preference.
 */
export function AdmitCard({ data }: { data: AdmitCardData }) {
  return (
    <div
      className="admit-card flex w-full flex-col overflow-hidden rounded-lg bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
      style={{ aspectRatio: "1 / 1.414" }}
    >
      {/* Masthead */}
      <div className="shrink-0 border-b-2 border-indigo-600">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <GraduationCap className="size-6" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-base font-bold uppercase tracking-wide">Springdale School</p>
            <p className="truncate text-[9px] text-slate-500">
              Mayur Vihar, New Delhi 110091 · CBSE Affiliation No. 2730123
            </p>
            <p className="truncate text-[8px] text-slate-400">
              Ph: 011-2345-6789 · www.springdale.edu
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 bg-slate-900 py-1 text-white">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Admit Card</span>
          <span className="text-[9px] opacity-70">· {data.session}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-4">
        {/* Candidate */}
        <div className="flex gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <PhotoFrame src={data.photo} name={data.studentName} className="w-[58px]" />
            <QrCode value={`${data.admissionNo}|${data.examName}`} className="size-11" />
          </div>

          <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 self-start text-[10px] leading-tight">
            {[
              ["Candidate", data.studentName],
              ["Father's Name", data.fatherName],
              ["Roll No.", data.rollNo],
              ["Admission No.", data.admissionNo],
              ["Class", `${data.className} · Section ${data.section}`],
              ["Examination", data.examName],
            ].map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="whitespace-nowrap font-semibold text-slate-500">{label}</dt>
                <dd className="truncate font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Centre */}
        <div className="rounded-md bg-slate-50 px-3 py-2 text-[10px]">
          <span className="font-semibold text-slate-500">Examination Centre: </span>
          <span className="font-medium">{data.centreName}</span>
          <span className="text-slate-500"> (Code {data.centreCode})</span>
        </div>

        {/* Timetable */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-md ring-1 ring-slate-200">
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-indigo-600 text-white">
                {["Subject", "Date", "Day", "Timing", "Room"].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((s, i) => (
                <tr key={s.subject} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-2 py-1.5 font-medium">{s.subject}</td>
                  <td className="whitespace-nowrap px-2 py-1.5">{s.date}</td>
                  <td className="px-2 py-1.5">{s.day}</td>
                  <td className="whitespace-nowrap px-2 py-1.5">{s.timing}</td>
                  <td className="px-2 py-1.5">{s.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Instructions
          </p>
          <ol className="list-inside list-decimal space-y-[2px] text-[8px] leading-snug text-slate-600">
            {INSTRUCTIONS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>

        {/* Signatures */}
        <div className="mt-auto grid grid-cols-3 gap-3 pt-3 text-center text-[8px] text-slate-500">
          {["Candidate's Signature", "Class Teacher", "Principal"].map((label) => (
            <div key={label}>
              <div className="mb-1 h-6 border-b border-slate-400" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
