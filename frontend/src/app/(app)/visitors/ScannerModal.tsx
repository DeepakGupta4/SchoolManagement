"use client";

import { useEffect, useRef } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Button, Modal } from "@/components/ui";

const ELEMENT_ID = "gate-qr-reader";

/**
 * Camera QR scanner for gate passes. Opens the device camera, decodes the
 * first QR it sees and hands the text back via `onScan`. The library is
 * imported dynamically so it never runs during SSR.
 */
export function ScannerModal({
  open,
  onClose,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    handledRef.current = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const scanner = new Html5Qrcode(ELEMENT_ID);
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScan(decoded);
          },
          () => {}
        );
      } catch {
        // Camera denied or unavailable — the modal copy explains what to do.
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onScan]);

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Scan gate pass"
      description="Point the camera at the visitor's QR code."
      size="sm"
      footer={<Button variant="outline" onClick={onClose}>Cancel</Button>}
    >
      <div id={ELEMENT_ID} className="mx-auto w-full max-w-xs overflow-hidden rounded-lg bg-black/5" />
      <p className="mt-3 text-center text-xs text-muted">
        Allow camera access when prompted. The scanner checks the visitor in or out automatically.
      </p>
    </Modal>
  );
}
