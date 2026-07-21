"use client";

import React, { useState } from "react";
import { CheckCircle, DollarSign, Search, User } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const students = [
  { id: "STU001", name: "Arjun Sharma",    class: "10-A", rollNo: "01", totalFee: 10900, paid: 5450,  due: 5450  },
  { id: "STU002", name: "Priya Patel",     class: "9-B",  rollNo: "12", totalFee: 10900, paid: 10900, due: 0     },
  { id: "STU003", name: "Rahul Verma",     class: "11-A", rollNo: "08", totalFee: 13800, paid: 6900,  due: 6900  },
  { id: "STU004", name: "Sneha Gupta",     class: "8-B",  rollNo: "22", totalFee: 8800,  paid: 8800,  due: 0     },
  { id: "STU005", name: "Karan Mehta",     class: "12-A", rollNo: "05", totalFee: 13800, paid: 0,     due: 13800 },
  { id: "STU006", name: "Ananya Singh",    class: "7-A",  rollNo: "17", totalFee: 8800,  paid: 4400,  due: 4400  },
];

const paymentMethods = ["Cash", "Online Transfer", "Cheque", "DD", "UPI"];
const feeTypes = ["Tuition Fee", "Transport Fee", "Lab Fee", "Library Fee", "Sports Fee", "Miscellaneous", "Full Fee"];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function CollectFeePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof students)[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [feeType, setFeeType] = useState("Tuition Fee");
  const [remarks, setRemarks] = useState("");
  const [success, setSuccess] = useState(false);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.class.toLowerCase().includes(search.toLowerCase())
  );

  const handleCollect = () => {
    if (!selected || !amount) return;
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelected(null);
      setAmount("");
      setRemarks("");
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Collect Fee" description="Search student and record fee payment" />

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-success-soft px-5 py-4">
          <CheckCircle className="size-5 shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-success-text">Payment Recorded Successfully!</p>
            <p className="mt-0.5 text-xs text-success-text">
              Receipt has been generated. Redirecting…
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        {/* Student Search */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-col items-stretch gap-3">
            <p className="text-sm font-semibold text-text">Select Student</p>
            <Input
              type="search"
              placeholder="Search by name, ID or class…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="size-4" />}
              aria-label="Search students"
            />
          </CardHeader>

          <div>
            {filtered.length === 0 && (
              <EmptyState
                icon={<User className="size-5" />}
                title="No students found"
                description={`Nothing matches “${search}”. Try a name, student ID or class.`}
              />
            )}
            {filtered.map((s, i) => {
              const isSelected = selected?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelected(s);
                    setAmount(String(s.due));
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    "focus-ring flex w-full items-center gap-3 border-l-2 px-5 py-3.5 text-left transition-colors",
                    i < filtered.length - 1 && "border-b border-b-border",
                    isSelected
                      ? "border-l-primary bg-primary-soft"
                      : "border-l-transparent hover:bg-surface-hover"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-md",
                      s.due === 0 ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text"
                    )}
                  >
                    <User className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-text">{s.name}</p>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold",
                          s.due === 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {s.due === 0 ? "✓ Cleared" : `${inr.format(s.due)} due`}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-subtle">
                      <span>{s.id}</span>
                      <span>Class {s.class}</span>
                      <span>Roll #{s.rollNo}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className={cn("h-full rounded-full", s.due === 0 ? "bg-success" : "bg-primary")}
                        style={{ width: `${(s.paid / s.totalFee) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-subtle">
                      {inr.format(s.paid)} paid of {inr.format(s.totalFee)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-text">Payment Details</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selected ? (
              <div className="flex items-center gap-3 rounded-md bg-primary-soft p-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-raised text-primary">
                  <User className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary-text">{selected.name}</p>
                  <p className="truncate text-xs text-primary-text">
                    Class {selected.class} · {selected.id}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-surface-sunken p-3.5 text-center">
                <p className="text-xs text-subtle">← Select a student first</p>
              </div>
            )}

            <Select
              label="Fee Type"
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              options={feeTypes.map((t) => ({ label: t, value: t }))}
            />

            <Input
              label="Amount (₹)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />

            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted">Payment Method</p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={method === m ? "primary" : "outline"}
                    onClick={() => setMethod(m)}
                    aria-pressed={method === m}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <Input
              label="Remarks (optional)"
              placeholder="Add a note…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            {selected && amount && (
              <div className="rounded-md bg-surface-sunken p-3.5">
                <div className="mb-2 flex justify-between gap-3 text-xs">
                  <span className="text-muted">Student</span>
                  <span className="font-medium text-text">{selected.name}</span>
                </div>
                <div className="mb-2 flex justify-between gap-3 text-xs">
                  <span className="text-muted">Fee Type</span>
                  <span className="font-medium text-text">{feeType}</span>
                </div>
                <div className="mb-2 flex justify-between gap-3 text-xs">
                  <span className="text-muted">Method</span>
                  <span className="font-medium text-text">{method}</span>
                </div>
                <div className="my-2.5 h-px bg-border" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-text">Total</span>
                  <span className="text-base font-semibold text-primary">
                    {inr.format(Number(amount))}
                  </span>
                </div>
              </div>
            )}

            <Button onClick={handleCollect} disabled={!selected || !amount} className="w-full">
              <DollarSign className="size-4" />
              Collect &amp; Generate Receipt
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
