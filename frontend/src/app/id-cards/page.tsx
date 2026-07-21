"use client";

import Link from "next/link";
import {
  ArrowRight, FileText, GraduationCap, IdCard as IdCardIcon, Printer, Users,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { IdCard } from "@/components/cards/IdCard";

const destinations = [
  {
    title: "Student ID Cards",
    description: "Generate and print PVC identity cards for enrolled students.",
    href: "/students/id-cards",
    icon: GraduationCap,
    gradient: "gradient-indigo",
    count: "1,240 students",
  },
  {
    title: "Teacher ID Cards",
    description: "Staff identity cards with designation and department.",
    href: "/teachers/id-cards",
    icon: Users,
    gradient: "gradient-emerald",
    count: "86 staff",
  },
  {
    title: "Admit Cards",
    description: "Examination admit cards with seating and centre details.",
    href: "/exams/admit-cards",
    icon: FileText,
    gradient: "gradient-amber",
    count: "Mid-Term 2025-26",
  },
];

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
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Cards & Documents"
        description="Identity cards, admit cards and printable school documents."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cards issued" value="1,118" icon={IdCardIcon} tone="indigo" sub="This session" />
        <StatCard label="Pending print" value="208" icon={Printer} tone="amber" sub="Awaiting batch" />
        <StatCard label="Admit cards" value="412" icon={FileText} tone="violet" sub="Mid-Term 2025-26" />
        <StatCard label="Reprints" value="37" icon={IdCardIcon} tone="rose" sub="Lost or damaged" />
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
