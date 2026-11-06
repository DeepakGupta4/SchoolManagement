"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Input, Select, useToast } from "@/components/ui";
import { buildFeeHeads, type FeeMode } from "@/lib/feeHeads";
import {
  createFeeAccount,
  balanceOf,
  totalBilled,
  totalPaid,
  type StudentFeeAccount,
} from "@/lib/api/feeLedger";
import { feeStructuresApi, feeTotal, type FeeStructure } from "@/lib/api/feeStructures";
import { busRoutesApi, type BusRoute } from "@/lib/api/busRoutes";
import { getStudent } from "@/lib/api/students";
import { classMatchesStructure } from "@/lib/classOrder";
import type { Student } from "@/types/student";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** The carried-forward arrears head — must match the server + admission form. */
const PREVIOUS_DUES_HEAD = "Previous Dues";
const isPrevDues = (name: string) => name.trim().toLowerCase() === PREVIOUS_DUES_HEAD.toLowerCase();

interface FeeSetupModalProps {
  open: boolean;
  /** The selected student's fee row — stored or provisional. */
  account: StudentFeeAccount;
  onClose: () => void;
  /** Called after a successful save, so the caller can refetch. */
  onSaved: () => void;
}

/**
 * Set up or edit a student's fees ANY time — not just at admission. Re-bills from
 * a fee structure (or a custom total), layers on carried-forward "Previous Dues"
 * and a manual concession, and sets the late fee + due date. It posts to the same
 * idempotent POST /accounts the admission form uses, which now preserves anything
 * already collected, so editing a live account never discards its payments.
 *
 * This is the office's answer to onboarding: a student added without fees, a wrong
 * bill to correct, or arrears/concession to adjust after the fact.
 */
export function FeeSetupModal({ open, account, onClose, onSaved }: FeeSetupModalProps) {
  const { toast } = useToast();

  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [feeMode, setFeeMode] = useState<FeeMode>("structure");
  const [feeStructureId, setFeeStructureId] = useState("");
  const [feeTotalInput, setFeeTotalInput] = useState("");
  const [concession, setConcession] = useState("");
  const [previousDues, setPreviousDues] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Load structures, routes and the student's transport info, then prefill the
  // form from the current account so "Save" with no edits reproduces the same bill.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Deferred so state isn't set synchronously inside the effect — the same
    // convention the rest of this page follows (react-hooks/set-state-in-effect).
    const t = setTimeout(() => {
      setLoading(true);
      Promise.all([
        feeStructuresApi.list(),
        busRoutesApi.list(),
        getStudent(account.studentId).catch(() => null),
      ])
        .then(([structs, routes, stu]) => {
          if (cancelled) return;
          setFeeStructures(structs);
          setBusRoutes(routes);
          setStudent(stu);

          const matching = structs.filter((s) => classMatchesStructure(s.class, account.className));
          // Prefer an exact class match over a band — mirrors the server's
          // pickStructureForClass — so re-billing reuses the structure the account
          // was opened from (its head names match → collected paid is preserved).
          const preferredStructure =
            matching.find(
              (s) => s.class.trim().toLowerCase() === account.className.trim().toLowerCase()
            ) ??
            matching[0] ??
            null;

          const arrears = account.heads.find((h) => isPrevDues(h.head));
          const nonArrears = account.heads.filter((h) => !isPrevDues(h.head));
          // Gross of the CURRENT non-arrears bill = net heads + the concession baked
          // out of them — prefilled so switching to a custom total shows today's fee.
          const currentGross = nonArrears.reduce((s, h) => s + h.billed, 0) + (account.concession || 0);
          // A custom (lump-sum) bill is a single "Tuition Fee" head — default back
          // to custom so opening and saving an unchanged account reproduces the same
          // head (keeping its collected paid) rather than flipping it to a structure.
          const looksCustom =
            nonArrears.length === 1 && nonArrears[0].head.trim().toLowerCase() === "tuition fee";

          setFeeMode(
            nonArrears.length === 0
              ? preferredStructure
                ? "structure"
                : "none"
              : looksCustom || !preferredStructure
                ? "custom"
                : "structure"
          );
          setFeeStructureId(preferredStructure?.id ?? "");
          setFeeTotalInput(currentGross > 0 ? String(currentGross) : "");
          // The MANUAL concession only — the server re-adds active scholarships, so
          // prefilling the total here would double-count them.
          const manual = account.manualConcession ?? account.concession ?? 0;
          setConcession(manual > 0 ? String(manual) : "");
          setPreviousDues(arrears && arrears.billed > 0 ? String(arrears.billed) : "");
          setLateFee(account.lateFee > 0 ? String(account.lateFee) : "");
          setDueDate(account.dueDate ?? "");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account.studentId]);

  const selectedStructure = feeStructures.find((s) => s.id === feeStructureId) ?? null;
  const selectedRoute = busRoutes.find((r) => r.code === student?.transportRouteCode) ?? null;

  // The exact heads the account will be re-billed with — mirrors the admission form.
  const feeHeads = buildFeeHeads(feeMode, selectedStructure, Number(feeTotalInput) || 0, {
    required: Boolean(student?.transportRequired),
    routeFee: selectedRoute?.fee ?? null,
  });
  const feeGross = feeHeads.reduce((sum, h) => sum + h.billed, 0);
  // Clamp to the CURRENT-fee gross so a concession can never eat into the arrears.
  const concessionNum = Math.min(Math.max(0, Number(concession) || 0), feeGross);
  const feeNet = Math.max(0, feeGross - concessionNum);
  const prevDuesNum = Math.max(0, Math.round(Number(previousDues) || 0));
  const lateFeeNum = Math.max(0, Math.round(Number(lateFee) || 0));
  const newBill = feeNet + prevDuesNum + lateFeeNum;

  const alreadyPaid = totalPaid(account);
  const currentBilled = totalBilled(account);
  const currentBalance = balanceOf(account);

  const nothingToSave = feeHeads.length === 0 && prevDuesNum === 0;

  const submit = async () => {
    const heads = [...feeHeads];
    // Arrears go on LAST so the concession (applied left-to-right on the server)
    // reduces the current fees first and never the carried-forward dues.
    if (prevDuesNum > 0) {
      heads.push({ head: PREVIOUS_DUES_HEAD, unit: prevDuesNum, frequency: "one-time", billed: prevDuesNum });
    }
    if (heads.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Pick a fee structure, enter a total, or add previous dues first.",
        variant: "warning",
      });
      return;
    }
    setSaving(true);
    try {
      await createFeeAccount({
        studentId: account.studentId,
        heads,
        concession: concessionNum,
        lateFee: lateFeeNum,
        dueDate: dueDate.trim() || undefined,
      });
      toast({
        title: "Fees updated",
        description: `${account.name}'s fees have been set.`,
      });
      onSaved();
      onClose();
    } catch (e) {
      toast({
        title: "Could not update fees",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Set up / edit fees"
      description={`${account.name} · ${account.admissionNo} · ${account.className} ${account.section}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || loading || nothingToSave}>
            {saving ? "Saving…" : "Save fees"}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-3 py-6">
          <div className="h-20 animate-pulse rounded-md bg-surface-hover" />
          <div className="h-32 animate-pulse rounded-md bg-surface-hover" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Current account snapshot */}
          <div className="rounded-md border border-border bg-surface-sunken px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current fees</p>
              <div className="flex gap-5 text-right">
                <div>
                  <p className="text-[11px] text-subtle">Billed</p>
                  <p className="text-sm font-semibold text-text">{inr(currentBilled)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-subtle">Paid</p>
                  <p className="text-sm font-semibold text-success">{inr(alreadyPaid)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-subtle">Balance</p>
                  <p className={`text-sm font-semibold ${currentBalance > 0 ? "text-danger" : "text-success"}`}>
                    {inr(currentBalance)}
                  </p>
                </div>
              </div>
            </div>
            {account.heads.length > 0 ? (
              <p className="mt-2 text-xs text-subtle">
                {account.heads.map((h) => `${h.head} ${inr(h.billed)}`).join(" · ")}
              </p>
            ) : (
              <p className="mt-2 text-xs text-subtle">No fees billed yet.</p>
            )}
          </div>

          {/* Editable basis */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Fee basis"
              value={feeMode}
              onChange={(e) => setFeeMode(e.target.value as FeeMode)}
              options={[
                { label: "Use a fee structure", value: "structure" },
                { label: "Enter a total fee", value: "custom" },
                { label: "No current fees (dues only)", value: "none" },
              ]}
            />
            {feeMode === "structure" && (
              <Select
                label="Fee structure"
                placeholder={feeStructures.length ? "Select a structure" : "No structures yet"}
                value={feeStructureId}
                onChange={(e) => setFeeStructureId(e.target.value)}
                options={feeStructures
                  .filter((s) => classMatchesStructure(s.class, account.className))
                  .map((s) => ({
                    label: `${s.code} — ₹${feeTotal(s).toLocaleString("en-IN")}`,
                    value: s.id,
                  }))}
              />
            )}
            {feeMode === "custom" && (
              <Input
                label="Total annual fee (₹)"
                inputMode="numeric"
                placeholder="e.g. 45000"
                value={feeTotalInput}
                onChange={(e) => setFeeTotalInput(e.target.value.replace(/[^\d]/g, ""))}
              />
            )}
            {feeMode !== "none" && (
              <Input
                label="Concession / discount (₹)"
                hint="Staff ward / sibling / merit — off this year's fees only"
                inputMode="numeric"
                placeholder="0"
                value={concession}
                onChange={(e) => setConcession(e.target.value.replace(/[^\d]/g, ""))}
              />
            )}
            <Input
              label="Previous year's dues (₹)"
              hint="Carried-forward arrears — billed as 'Previous Dues'"
              inputMode="numeric"
              placeholder="0"
              value={previousDues}
              onChange={(e) => setPreviousDues(e.target.value.replace(/[^\d]/g, ""))}
            />
            <Input
              label="Late fee (₹)"
              hint="Optional — collected alongside the heads"
              inputMode="numeric"
              placeholder="0"
              value={lateFee}
              onChange={(e) => setLateFee(e.target.value.replace(/[^\d]/g, ""))}
            />
            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {feeMode === "structure" &&
            feeStructures.filter((s) => classMatchesStructure(s.class, account.className)).length === 0 && (
              <p className="rounded-md bg-warning-soft/50 px-3 py-2 text-xs text-warning-text">
                No fee structure for <span className="font-semibold">{account.className}</span> yet — create
                one in <span className="font-semibold">Fees → Fee Structure</span>, or enter a total fee
                instead.
              </p>
            )}

          {/* New-bill preview */}
          {!nothingToSave && (
            <div className="rounded-md border border-primary/30 bg-primary-soft/40 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">New bill</p>
              <p className="mt-1 text-muted">
                {feeGross > 0 && (
                  <>
                    Annual fees <span className="font-medium text-text">{inr(feeGross)}</span>
                    {concessionNum > 0 && (
                      <>
                        {" − concession "}
                        <span className="font-medium text-success-text">{inr(concessionNum)}</span>
                      </>
                    )}
                    {" = "}
                    <span className="font-medium text-text">{inr(feeNet)}</span>
                  </>
                )}
                {prevDuesNum > 0 && (
                  <>
                    {feeGross > 0 ? " · " : ""}previous dues{" "}
                    <span className="font-medium text-warning-text">{inr(prevDuesNum)}</span>
                  </>
                )}
                {lateFeeNum > 0 && (
                  <>
                    {" · late fee "}
                    <span className="font-medium text-warning-text">{inr(lateFeeNum)}</span>
                  </>
                )}
                {" · total billed "}
                <span className="font-semibold text-text">{inr(newBill)}</span>
              </p>
              {alreadyPaid > 0 && (
                <p className="mt-1.5 text-xs text-subtle">
                  {inr(alreadyPaid)} already collected is kept — editing recomputes the bill but never
                  discards recorded payments.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
