"use client";

import { Download, Printer } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { CERTIFICATE_DOC_META, type Certificate } from "@/lib/api/certificates";
import { CertificateDocument } from "./CertificateDocument";

/**
 * Full-page preview of a generated certificate with Print and Download (PDF)
 * actions. Both use the browser print pipeline — "Download" is the browser's
 * "Save as PDF" — and the global `@media print` rules ensure only the
 * `.print-sheet` document reaches paper, not the modal chrome.
 */
export function CertificatePreviewModal({
  record,
  schoolName,
  schoolAddress,
  onOpenChange,
}: {
  record: Certificate | null;
  schoolName: string;
  schoolAddress?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const issued = record?.status === "issued";

  return (
    <Modal
      open={Boolean(record)}
      onOpenChange={onOpenChange}
      title={record ? CERTIFICATE_DOC_META[record.type].title : "Certificate"}
      description={record ? `${record.code} · ${record.student}` : ""}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="size-4" />
            Download PDF
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </>
      }
    >
      {record && (
        <div className="flex flex-col gap-3">
          {!issued && (
            <p className="print-hide rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-text">
              This is a preview. Issue the certificate to stamp its date and generate a QR
              verification code before sharing it.
            </p>
          )}
          <CertificateDocument
            record={record}
            schoolName={schoolName}
            schoolAddress={schoolAddress}
          />
        </div>
      )}
    </Modal>
  );
}
