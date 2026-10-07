"use client";

import type { ComponentType } from "react";
import {
  Phone, Mail, Briefcase, MapPin, GraduationCap, KeyRound, MessageSquare, Pencil,
  ShieldCheck, Star, Car, Sparkles, UserRound,
} from "lucide-react";
import { Avatar, Badge, Button, Modal } from "@/components/ui";
import type { ParentDirectoryEntry } from "@/lib/api/parent";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const RELATION_VARIANT: Record<string, BadgeVariant> = {
  Father: "info",
  Mother: "success",
  Guardian: "default",
};

/** A labelled contact tile; becomes a tap-to-call / tap-to-mail link when a href is given. */
function ContactChip({
  icon: Icon,
  label,
  value,
  href,
  full,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  full?: boolean;
}) {
  const inner = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-subtle">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-subtle">{label}</span>
        <span className="block truncate text-sm text-text">{value || "—"}</span>
      </span>
    </>
  );
  const base = `flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 ${full ? "sm:col-span-2" : ""}`;
  return href && value ? (
    <a href={href} className={`${base} transition-colors hover:border-primary hover:bg-primary-soft`}>
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}

/**
 * The parent "View" dialog — a richer detail view than the generic DetailModal:
 * an identity header (avatar + relation/source/flag badges), tap-able contact
 * tiles, the linked children as cards, and quick actions (Message / Create login /
 * Edit). Used in place of DetailModal so a parent's full record reads at a glance.
 */
export function ParentDetailModal({
  parent,
  open,
  onOpenChange,
  onInvite,
  onMessage,
  onEdit,
  inviting,
}: {
  parent: ParentDirectoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (p: ParentDirectoryEntry) => void;
  onMessage: (p: ParentDirectoryEntry) => void;
  onEdit: (p: ParentDirectoryEntry) => void;
  inviting: boolean;
}) {
  const p = parent;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Parent details"
      size="lg"
      footer={
        p ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <span className="hidden text-xs text-subtle sm:block">
              {p.source === "manual" ? "Added manually" : "Auto-derived from student records"}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onMessage(p)}
                disabled={!p.email}
                title={p.email ? "Message this parent" : "Add an email to message this parent"}
              >
                <MessageSquare className="size-4" />
                Message
              </Button>
              <Button
                variant="outline"
                onClick={() => onInvite(p)}
                disabled={!p.email || inviting}
                title={p.email ? "Create a parent portal login" : "Add an email to create a portal login"}
              >
                <KeyRound className="size-4" />
                {inviting ? "Creating…" : "Create login"}
              </Button>
              {p.source === "manual" && (
                <Button variant="outline" onClick={() => onEdit(p)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {p && (
        <div className="flex flex-col gap-5">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <Avatar name={p.name} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-text">{p.name}</h3>
              <p className="truncate text-sm text-subtle">{p.occupation || "Parent / Guardian"}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={RELATION_VARIANT[p.relation] ?? "default"}>{p.relation}</Badge>
                <Badge variant="outline" className="gap-1">
                  {p.source === "manual" ? <UserRound className="size-3" /> : <Sparkles className="size-3" />}
                  {p.source === "manual" ? "Manual" : "Auto"}
                </Badge>
                {p.isPrimary && (
                  <Badge variant="info" className="gap-1">
                    <Star className="size-3" /> Primary
                  </Badge>
                )}
                {p.isEmergencyContact && (
                  <Badge variant="danger" className="gap-1">
                    <ShieldCheck className="size-3" /> Emergency
                  </Badge>
                )}
                {p.isPickupAuthorized && (
                  <Badge variant="success" className="gap-1">
                    <Car className="size-3" /> Pickup
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact grid */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ContactChip icon={Phone} label="Phone" value={p.phone} href={p.phone ? `tel:${p.phone}` : undefined} />
            <ContactChip icon={Mail} label="Email" value={p.email} href={p.email ? `mailto:${p.email}` : undefined} />
            <ContactChip icon={Briefcase} label="Occupation" value={p.occupation} />
            <ContactChip icon={MapPin} label="Address" value={p.address} full />
          </div>

          {/* Children */}
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-subtle">
              <GraduationCap className="size-3.5" />
              Children ({p.childCount})
            </p>
            {p.childCount > 0 ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {p.children.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface-sunken px-3 py-2"
                  >
                    <Avatar name={c.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{c.name}</p>
                      <p className="truncate text-xs text-subtle">
                        {c.className}
                        {c.section ? ` · Section ${c.section}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-surface-sunken px-3 py-4 text-center text-sm text-subtle">
                No children linked to this contact.
              </p>
            )}
          </div>

          {/* Portal hint when no email */}
          {!p.email && (
            <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-text">
              No email on file — add one (edit this record, or the student it came from) to create a portal
              login or send messages.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
