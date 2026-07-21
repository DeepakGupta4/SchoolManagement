"use client";

import { useState } from "react";
import { CheckCircle2, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import { certificatesApi, type Certificate } from "@/lib/api/certificates";

type Result =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "valid"; certificate: Certificate }
  | { kind: "invalid"; code: string };

/**
 * Looks a certificate up by the verification code printed on it.
 *
 * Only certificates that were actually issued can verify — a pending or
 * rejected request must fail even if someone guesses its code.
 */
export function VerifyCodeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result>({ kind: "idle" });

  const verify = async () => {
    const query = code.trim().toUpperCase();
    if (!query) return;

    setResult({ kind: "checking" });
    const all = await certificatesApi.list();
    const match = all.find(
      (c) => c.status === "issued" && c.verificationCode?.toUpperCase() === query
    );
    setResult(match ? { kind: "valid", certificate: match } : { kind: "invalid", code: query });
  };

  // The modal unmounts its body between opens, but this component stays
  // mounted, so state is reset explicitly on close.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCode("");
      setResult({ kind: "idle" });
    }
    onOpenChange(next);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Verify a certificate"
      description="Enter the verification code printed on the certificate or encoded in its QR."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <Button onClick={verify} disabled={!code.trim() || result.kind === "checking"}>
            {result.kind === "checking" ? "Checking…" : "Verify"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Verification code"
          placeholder="VC-8KD2-91XM"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (result.kind !== "idle") setResult({ kind: "idle" });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              verify();
            }
          }}
          icon={<Search className="size-4" />}
          autoFocus
        />

        {result.kind === "valid" && (
          <div className="rounded-md border border-success bg-success-soft p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-success-text">
              <CheckCircle2 className="size-4" />
              Genuine certificate
            </p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
              {[
                ["Student", result.certificate.student],
                ["Admission no.", result.certificate.admissionNo],
                ["Class", result.certificate.className],
                ["Type", `${result.certificate.type} Certificate`],
                ["Issued on", result.certificate.issueDate ?? "—"],
                ["Reference", result.certificate.code],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-success-text/80">{label}</dt>
                  <dd className="font-medium text-success-text">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {result.kind === "invalid" && (
          <div className="rounded-md border border-danger bg-danger-soft p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-danger-text">
              <ShieldAlert className="size-4" />
              Not verified
            </p>
            <p className="mt-1.5 text-xs text-danger-text">
              No issued certificate carries the code &ldquo;{result.code}&rdquo;. It may be mistyped,
              or the certificate may not have been issued yet.
            </p>
          </div>
        )}

        {result.kind === "idle" && (
          <p className="flex items-start gap-2 text-xs text-subtle">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Only issued certificates verify. Pending and rejected requests will not match.
          </p>
        )}
      </div>
    </Modal>
  );
}
