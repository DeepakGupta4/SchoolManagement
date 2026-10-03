"use client";

import { Printer } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { ReportCard, type ReportCardData } from "@/components/cards/ReportCard";
import { useSchoolIdentity } from "@/lib/schoolIdentity";

export function ReportCardModal({
  data,
  onOpenChange,
}: {
  data: ReportCardData | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { identity } = useSchoolIdentity();
  return (
    <Modal
      open={Boolean(data)}
      onOpenChange={onOpenChange}
      title="Report card"
      description={data ? `${data.studentName} · ${data.examName}` : ""}
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
      {data && (
        <div className="print-sheet mx-auto max-w-xl">
          <ReportCard data={data} school={identity} />
        </div>
      )}
    </Modal>
  );
}
