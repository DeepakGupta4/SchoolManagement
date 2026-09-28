"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { Modal, Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import {
  assignmentSchema,
  MAX_ASSIGNMENT_DATE,
  type AssignmentSchema,
} from "@/lib/schemas/assignment";
import {
  ASSIGNMENT_TYPE_OPTIONS,
  deriveAssignmentStatus,
  type Assignment,
  type AssignmentStatus,
} from "@/lib/api/assignments";
import { MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";
import { listStudents } from "@/lib/api/students";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName } from "@/types/teacher";

const emptyValues: AssignmentSchema = {
  title: "",
  subject: "",
  class: "",
  teacher: "",
  given: TODAY_ISO,
  due: "",
  totalMarks: 10,
  submitted: 0,
  total: 30,
  status: "upcoming",
  type: "",
};

/** Presentation for the live status preview — mirrors the list page's badges. */
const statusPreview: Record<
  AssignmentStatus,
  { icon: typeof Clock; label: string; className: string }
> = {
  upcoming: { icon: AlertCircle, label: "Upcoming", className: "bg-warning-soft text-warning-text" },
  active: { icon: Clock, label: "Active", className: "bg-info-soft text-info-text" },
  overdue: { icon: XCircle, label: "Overdue", className: "bg-danger-soft text-danger-text" },
  completed: { icon: CheckCircle2, label: "Completed", className: "bg-success-soft text-success-text" },
};

interface AssignmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Assignment | null;
  saving?: boolean;
  onSubmit: (values: AssignmentSchema) => Promise<void>;
}

export function AssignmentFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: AssignmentFormModalProps) {
  const isEdit = Boolean(record);
  const { classOptions } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();

  // Real teachers power the "assigned by" picker so the owner chooses from staff
  // they've actually created instead of typing a name by hand.
  const [teacherNames, setTeacherNames] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listTeachers()
      .then((teachers) => {
        if (!cancelled) setTeacherNames(teachers.map(teacherName));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: emptyValues,
  });

  // useWatch (not watch) so the React Compiler can still optimise this component.
  const given = useWatch({ control, name: "given" });
  const due = useWatch({ control, name: "due" });
  const className = useWatch({ control, name: "class" });

  // "completed" is the one status a teacher sets by hand; everything else is
  // derived from the dates. Kept in local state, initialised from the record.
  const [completed, setCompleted] = useState(false);

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
    // setState in an effect is deferred (React Compiler): a 0ms timer + cleanup.
    const t = setTimeout(() => setCompleted(record?.status === "completed"), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Live roster for the chosen class (real students), so the class size is truthful.
  const [roster, setRoster] = useState<number | null>(null);
  useEffect(() => {
    if (!open || !className) {
      const t = setTimeout(() => setRoster(null), 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    listStudents({ className })
      .then((rows) => {
        if (!cancelled) setRoster(rows.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, className]);

  // A new assignment defaults its class size to the live roster; still editable.
  // Skipped in edit mode so a stored count is never clobbered on open.
  useEffect(() => {
    if (!open || isEdit || roster == null || roster <= 0) return;
    setValue("total", roster, { shouldValidate: true });
  }, [open, isEdit, roster, setValue]);

  const previewStatus = deriveAssignmentStatus(given ?? "", due ?? "", completed);
  const preview = statusPreview[previewStatus];
  const PreviewIcon = preview.icon;

  // Status is computed here from the dates + the completed flag, so what gets
  // persisted always agrees with the badge shown in the list.
  const submit = handleSubmit((values) =>
    onSubmit({
      ...values,
      status: deriveAssignmentStatus(values.given, values.due, completed),
    })
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit assignment" : "New assignment"}
      description={
        isEdit
          ? "Update this assignment. Changes apply immediately."
          : "Set a new assignment. The title must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create assignment"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          placeholder="Quadratic Equations Practice"
          {...register("title")}
          error={errors.title?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Subject"
            required
            placeholder="Select subject"
            options={subjectOptions}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Select
            label="Class"
            required
            placeholder="Select class"
            options={classOptions}
            {...register("class")}
            error={errors.class?.message}
          />
          <Select
            label="Teacher"
            required
            placeholder="Select teacher"
            options={teacherNames.map((t) => ({ label: t, value: t }))}
            {...register("teacher")}
            error={errors.teacher?.message}
          />
          <Select
            label="Type"
            required
            placeholder="Select type"
            options={ASSIGNMENT_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("type")}
            error={errors.type?.message}
          />
          <Input
            label="Given on"
            required
            type="date"
            min={MIN_RECORD_DATE}
            max={MAX_ASSIGNMENT_DATE}
            {...register("given")}
            error={errors.given?.message}
          />
          <Input
            label="Due date"
            required
            type="date"
            // The picker itself enforces due >= given (the schema double-checks).
            min={given || MIN_RECORD_DATE}
            max={MAX_ASSIGNMENT_DATE}
            {...register("due")}
            error={errors.due?.message}
          />
          <Input
            label="Total marks"
            type="number"
            min={1}
            {...register("totalMarks")}
            error={errors.totalMarks?.message}
          />
          <Input
            label="Students"
            type="number"
            min={1}
            hint={
              roster != null
                ? `Class roster: ${roster} student${roster === 1 ? "" : "s"}`
                : "Auto-fills from the class roster — editable"
            }
            {...register("total")}
            error={errors.total?.message}
          />
          <Input
            label="Submitted"
            type="number"
            min={0}
            {...register("submitted")}
            error={errors.submitted?.message}
          />
        </div>

        {/* Status is derived from the dates, not typed. The teacher only chooses
            whether the assignment is closed. */}
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-sunken p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted">Status</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                preview.className
              )}
            >
              <PreviewIcon className="size-3" />
              {preview.label}
            </span>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="focus-ring size-4 cursor-pointer rounded-sm accent-primary"
            />
            <span className="text-sm text-text">Mark as completed</span>
          </label>
          <p className="text-[11px] text-subtle">
            Upcoming, active and overdue are set automatically from the given and due dates.
          </p>
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
