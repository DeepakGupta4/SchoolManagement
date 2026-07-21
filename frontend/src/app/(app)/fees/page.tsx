"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  GraduationCap,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, PageHeader } from "@/components/ui";

const stats: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  gradient: string;
  trend: "up" | "down";
}[] = [
  { label: "Total Collected", value: "₹24,85,000", sub: "+12% this month", icon: Wallet, gradient: "gradient-emerald", trend: "up" },
  { label: "Pending Fees", value: "₹3,42,500", sub: "148 students", icon: Clock, gradient: "gradient-amber", trend: "down" },
  { label: "Defaulters", value: "42", sub: "Need follow-up", icon: AlertTriangle, gradient: "gradient-rose", trend: "down" },
  { label: "Scholarships", value: "38", sub: "Active awards", icon: GraduationCap, gradient: "gradient-violet", trend: "up" },
];

const recentPayments = [
  { id: "RCP001", student: "Arjun Sharma", class: "10-A", amount: "₹12,500", date: "Jul 18, 2025", method: "Online", status: "paid" },
  { id: "RCP002", student: "Priya Patel", class: "9-B", amount: "₹11,000", date: "Jul 17, 2025", method: "Cash", status: "paid" },
  { id: "RCP003", student: "Rahul Verma", class: "11-A", amount: "₹13,500", date: "Jul 16, 2025", method: "Cheque", status: "pending" },
  { id: "RCP004", student: "Sneha Gupta", class: "8-B", amount: "₹9,500", date: "Jul 15, 2025", method: "Online", status: "paid" },
  { id: "RCP005", student: "Karan Mehta", class: "12-A", amount: "₹15,000", date: "Jul 14, 2025", method: "Online", status: "paid" },
];

const quickLinks: {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
}[] = [
  { title: "Fee Structure", desc: "Define class-wise fee heads", href: "/fees/structure", icon: BookOpen, gradient: "gradient-indigo" },
  { title: "Collect Fee", desc: "Record new fee payments", href: "/fees/collect", icon: CreditCard, gradient: "gradient-emerald" },
  { title: "Receipts", desc: "View & print fee receipts", href: "/fees/receipts", icon: Receipt, gradient: "gradient-cyan" },
  { title: "Defaulters", desc: "Students with pending dues", href: "/fees/defaulters", icon: AlertTriangle, gradient: "gradient-rose" },
  { title: "Scholarships", desc: "Manage fee concessions", href: "/fees/scholarships", icon: Award, gradient: "gradient-violet" },
];

const monthlyData = [
  { month: "Feb", collected: 18, pending: 4 },
  { month: "Mar", collected: 22, pending: 3 },
  { month: "Apr", collected: 20, pending: 5 },
  { month: "May", collected: 25, pending: 2 },
  { month: "Jun", collected: 23, pending: 4 },
  { month: "Jul", collected: 24, pending: 3 },
];
const maxVal = 30;

export default function FeesPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Fee Management"
        description="Track collections, dues, and scholarships"
        actions={
          <Link
            href="/fees/collect"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <DollarSign className="size-4" />
            Collect Fee
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3.5">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-sm ${s.gradient}`}>
                <s.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{s.label}</p>
                <p className="mt-0.5 truncate text-xl font-semibold text-text">{s.value}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-subtle">
                  {s.trend === "up" ? (
                    <TrendingUp className="size-3 text-success" />
                  ) : (
                    <TrendingDown className="size-3 text-danger" />
                  )}
                  {s.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quickLinks.map((q) => (
          <Link key={q.href} href={q.href} className="focus-ring rounded-lg">
            <Card className="card-hover h-full">
              <CardContent className="flex flex-col gap-3">
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-sm ${q.gradient}`}>
                  <q.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{q.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{q.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Open <ArrowRight className="size-3" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Monthly Chart — CSS bars, only the bar height is a dynamic value */}
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Monthly Collection</p>
              <p className="mt-0.5 text-xs text-muted">Collected vs Pending (in Lakhs ₹)</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-36 items-end gap-4">
              {monthlyData.map((d) => (
                <div key={d.month} className="flex h-full flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 flex-col justify-end gap-0.5">
                    <div
                      className="w-full min-h-1 rounded-t-sm bg-danger-soft"
                      style={{ height: `${(d.pending / maxVal) * 100}%` }}
                    />
                    <div
                      className="w-full min-h-2 rounded-t-sm bg-primary"
                      style={{ height: `${(d.collected / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-subtle">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className="size-2.5 rounded-sm bg-primary" />
                Collected
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className="size-2.5 rounded-sm bg-danger-soft" />
                Pending
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Recent Payments</p>
              <p className="mt-0.5 text-xs text-muted">Latest fee transactions</p>
            </div>
            <Link
              href="/fees/receipts"
              className="focus-ring shrink-0 rounded-sm text-xs font-semibold text-primary hover:text-primary-hover"
            >
              View all →
            </Link>
          </CardHeader>
          <div>
            {recentPayments.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-5 py-3 ${
                  i < recentPayments.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                    p.status === "paid" ? "bg-success-soft text-success-text" : "bg-warning-soft text-warning-text"
                  }`}
                >
                  {p.status === "paid" ? <CheckCircle className="size-4" /> : <Clock className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{p.student}</p>
                  <p className="mt-0.5 truncate text-xs text-subtle">
                    Class {p.class} · {p.date} · {p.method}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-text">{p.amount}</p>
                  <Badge variant={p.status === "paid" ? "success" : "warning"} className="mt-1">
                    {p.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
