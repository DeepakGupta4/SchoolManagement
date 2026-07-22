"use client";

import { Printer, School } from "lucide-react";
import { Button, Modal } from "@/components/ui";

export interface PayrollEmployee {
  id: string;
  name: string;
  role: string;
  dept: string;
  basic: number;
  hra: number;
  ta: number;
  deductions: number;
  net: number;
  status: string;
  bank: string;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Current month label for the payslip period, e.g. "July 2025". */
function payPeriod() {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function PayslipModal({
  employee,
  onOpenChange,
}: {
  employee: PayrollEmployee | null;
  onOpenChange: (open: boolean) => void;
}) {
  const gross = employee ? employee.basic + employee.hra + employee.ta : 0;
  // PF + professional tax split shown so deductions aren't one opaque number.
  const pf = employee ? Math.round(employee.basic * 0.12) : 0;
  const otherDeductions = employee ? Math.max(0, employee.deductions - pf) : 0;

  return (
    <Modal
      open={Boolean(employee)}
      onOpenChange={onOpenChange}
      title="Salary slip"
      description={employee ? `${employee.name} · ${payPeriod()}` : ""}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </>
      }
    >
      {employee && (
        <div className="print-sheet">
          <div className="payslip overflow-hidden rounded-lg bg-white text-slate-900 ring-1 ring-slate-200">
            {/* Masthead */}
            <div className="flex items-center gap-3 border-b-2 border-indigo-600 px-5 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white">
                <School className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold uppercase tracking-wide">Springdale School</p>
                <p className="truncate text-[11px] text-slate-500">
                  Mayur Vihar, New Delhi 110091
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Salary Slip</p>
                <p className="text-sm font-semibold text-indigo-700">{payPeriod()}</p>
              </div>
            </div>

            {/* Employee */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 px-5 py-4 text-xs sm:grid-cols-4">
              {[
                ["Employee", employee.name],
                ["Employee ID", employee.id],
                ["Designation", employee.role],
                ["Department", employee.dept],
                ["Bank A/C", employee.bank],
                ["Payment status", employee.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>

            {/* Earnings vs deductions */}
            <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2">
              <div className="bg-white px-5 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Earnings
                </p>
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      ["Basic Pay", employee.basic],
                      ["House Rent Allowance", employee.hra],
                      ["Travel Allowance", employee.ta],
                    ].map(([label, amount]) => (
                      <tr key={label as string}>
                        <td className="py-1 text-slate-600">{label}</td>
                        <td className="py-1 text-right font-mono">{inr(amount as number)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 font-semibold">
                      <td className="py-1.5">Gross Earnings</td>
                      <td className="py-1.5 text-right font-mono">{inr(gross)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white px-5 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Deductions
                </p>
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      ["Provident Fund (12%)", pf],
                      ["Professional Tax & Others", otherDeductions],
                    ].map(([label, amount]) => (
                      <tr key={label as string}>
                        <td className="py-1 text-slate-600">{label}</td>
                        <td className="py-1 text-right font-mono">{inr(amount as number)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 font-semibold">
                      <td className="py-1.5">Total Deductions</td>
                      <td className="py-1.5 text-right font-mono">{inr(employee.deductions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net */}
            <div className="flex items-center justify-between border-t-2 border-indigo-600 bg-indigo-50 px-5 py-3">
              <div>
                <p className="text-xs font-semibold text-slate-700">Net Payable</p>
                <p className="text-[10px] text-slate-500">Gross earnings less deductions</p>
              </div>
              <p className="font-mono text-lg font-bold text-indigo-700">{inr(employee.net)}</p>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between gap-4 px-5 py-5 text-[10px] text-slate-500">
              <p className="max-w-[55%] leading-snug">
                This is a computer-generated salary slip and does not require a physical signature.
              </p>
              <div className="text-center">
                <div className="mb-0.5 h-8" />
                <div className="w-36 border-t border-slate-400 pt-0.5">
                  Authorised signatory · Accounts
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
