"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import {
  ArrowRight, FileText, GraduationCap, IdCard as IdCardIcon, Users,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { IdCard } from "@/components/cards/IdCard";
import { useAsyncList } from "@/hooks/useAsyncList";
import { listStudents } from "@/lib/api/students";
import { listTeachers } from "@/lib/api/teachers";
import type { Student } from "@/types/student";
import type { Teacher } from "@/types/teacher";

const sampleHolder = {
  id: "sample",
  name: "Aarav Sharma",
  role: "Student",
  identifier: "ADM2024001",
  identifierLabel: "Adm. No.",
  affiliation: "Class 10 · Section A",
  bloodGroup: "B+",
  phone: "9810012345",
  guardianOrDesignation: "Rajesh Sharma",
  guardianLabel: "Guardian",
  validTill: "31 Mar 2026",
};

export default function IdCardsOverviewPage() {
  const fetchStudents = useCallback(() => listStudents({ status: "active" }), []);
  const fetchTeachers = useCallback(() => listTeachers({ status: "active" }), []);

  const { items: students } = useAsyncList<Student>(fetchStudents);
  const { items: teachers } = useAsyncList<Teacher>(fetchTeachers);

  const destinations = useMemo(
    () => [
      {
        title: "Student ID Cards",
        description: "Generate and print PVC identity cards for enrolled students.",
        href: "/students/id-cards",
        icon: GraduationCap,
        gradient: "gradient-indigo",
        count: `${students.length} students`,
      },
      {
        title: "Teacher ID Cards",
        description: "Staff identity cards with designation and department.",
        href: "/teachers/id-cards",
        icon: Users,
        gradient: "gradient-emerald",
        count: `${teachers.length} staff`,
      },
      {
        title: "Admit Cards",
        description: "Examination admit cards with seating and centre details.",
        href: "/exams/admit-cards",
        icon: FileText,
        gradient: "gradient-amber",
        count: "Mid-Term 2025-26",
      },
    ],
    [students.length, teachers.length]
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Cards & Documents"
        description="Identity cards, admit cards and printable school documents."
      />

      {/*
        Card issuance, print queues and reprints have no resource behind them
        yet, so those figures cannot be derived — rather than print invented
        precision, this row reports only what the student and teacher
        directories actually know: how many people need a card.
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Students on roll"
          value={students.length}
          icon={GraduationCap}
          tone="indigo"
          sub="Eligible for a student card"
        />
        <StatCard
          label="Teaching staff"
          value={teachers.length}
          icon={Users}
          tone="emerald"
          sub="Eligible for a staff card"
        />
        <StatCard
          label="Card holders"
          value={students.length + teachers.length}
          icon={IdCardIcon}
          tone="violet"
          sub="Students and staff combined"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {destinations.map((d) => (
          <Link key={d.href} href={d.href} className="focus-ring rounded-lg">
            <Card className="card-hover h-full">
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-md text-white ${d.gradient}`}
                  >
                    <d.icon className="size-4.5" />
                  </div>
                  <ArrowRight className="size-4 text-subtle" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{d.title}</p>
                  <p className="mt-1 text-xs text-muted">{d.description}</p>
                </div>
                <Badge variant="default" className="mt-auto w-fit">
                  {d.count}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-text">Card preview</p>
            <Badge variant="info">CR80</Badge>
          </CardHeader>
          <CardContent>
            <IdCard holder={sampleHolder} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-text">Print specifications</p>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["ID card size", "CR80 — 85.6 × 54 mm"],
                ["Admit card size", "A5 portrait — 148 × 210 mm"],
                ["Card stock", "PVC, 760 micron"],
                ["Print colour", "CMYK, full bleed"],
                ["Photo", "Passport, 35 × 45 mm"],
                ["Validity", "One academic session"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-subtle">{label}</dt>
                  <dd className="mt-0.5 font-medium text-text">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 rounded-md bg-warning-soft px-3.5 py-3">
              <p className="text-xs text-warning-text">
                <span className="font-semibold">Note:</span> the QR block on every card is currently a visual
                placeholder — it renders a deterministic pattern but encodes nothing and will not scan. A real
                encoder must be wired in before cards are issued.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
