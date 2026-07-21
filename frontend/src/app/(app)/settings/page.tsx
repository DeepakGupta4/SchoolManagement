"use client";

import React, { useState } from "react";
import {
  Bell,
  Building2,
  CalendarRange,
  CheckCircle2,
  Palette,
  Plug,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Field,
  Input,
  Select,
  StatCard,
  PageHeader,
  Textarea,
  Tooltip,
  useToast,
} from "@/components/ui";

const TABS = [
  { id: "profile", label: "School Profile", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "session", label: "Academic Session", icon: CalendarRange },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PROFILE_DEFAULTS = {
  name: "Delhi Public School, Sector 45",
  code: "DPS-GGN-45",
  affiliation: "CBSE — Affiliation No. 530412",
  principal: "Dr. Priya Sharma",
  email: "office@dpssector45.edu.in",
  phone: "+91 124 428 6600",
  board: "cbse",
  medium: "english",
  address:
    "Plot No. 12, Sector 45, Sushant Lok Phase II, Gurugram, Haryana 122003",
};

const BRANDING_DEFAULTS = {
  displayName: "DPS Sector 45",
  tagline: "Service Before Self",
  theme: "indigo",
  density: "comfortable",
  receiptFooter:
    "This is a computer generated receipt and does not require a signature. For queries contact the Accounts Office (Mon–Fri, 9 AM – 3 PM).",
};

const SESSION_DEFAULTS = {
  session: "2026-27",
  startDate: "2026-04-01",
  endDate: "2027-03-31",
  terms: "3",
  weekOff: "sunday",
  attendanceMode: "period",
};

const NOTIFICATION_DEFAULTS = {
  channel: "whatsapp",
  feeReminderDays: "3",
  absentAlert: "immediate",
  senderId: "DPSG45",
  digest:
    "Send the principal a daily 6 PM digest covering attendance below 85%, pending fee dues and unresolved leave requests.",
};

const THEME_OPTIONS = [
  { label: "Indigo (default)", value: "indigo" },
  { label: "Emerald", value: "emerald" },
  { label: "Violet", value: "violet" },
  { label: "Cyan", value: "cyan" },
];

const INTEGRATIONS = [
  {
    id: "razorpay",
    name: "Razorpay",
    category: "Fee payments",
    detail: "UPI, netbanking and card collection for term fees.",
    status: "Connected",
    variant: "success" as const,
    account: "acct_DPS45_live",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    category: "Messaging",
    detail: "Attendance and fee reminders to parent numbers.",
    status: "Connected",
    variant: "success" as const,
    account: "+91 90000 45045",
  },
  {
    id: "msg91",
    name: "MSG91 SMS",
    category: "Messaging",
    detail: "Fallback transactional SMS on DLT-approved templates.",
    status: "Connected",
    variant: "success" as const,
    account: "Sender ID DPSG45",
  },
  {
    id: "gsuite",
    name: "Google Workspace",
    category: "Identity",
    detail: "Staff single sign-on with @dpssector45.edu.in accounts.",
    status: "Connected",
    variant: "success" as const,
    account: "dpssector45.edu.in",
  },
  {
    id: "tally",
    name: "Tally Prime",
    category: "Accounting",
    detail: "Nightly export of fee and expense vouchers.",
    status: "Action needed",
    variant: "warning" as const,
    account: "Token expires in 6 days",
  },
  {
    id: "biometric",
    name: "eSSL Biometric",
    category: "Attendance",
    detail: "Staff punch-in sync from the gate device.",
    status: "Not connected",
    variant: "default" as const,
    account: "—",
  },
];

export default function SettingsPage() {
  const { toast } = useToast();

  const [tab, setTab] = useState<TabId>("profile");
  const [profile, setProfile] = useState(PROFILE_DEFAULTS);
  const [branding, setBranding] = useState(BRANDING_DEFAULTS);
  const [session, setSession] = useState(SESSION_DEFAULTS);
  const [notifications, setNotifications] = useState(NOTIFICATION_DEFAULTS);
  const [enabled, setEnabled] = useState<string[]>([
    "razorpay",
    "whatsapp",
    "msg91",
    "gsuite",
    "tally",
  ]);

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  const toggleIntegration = (id: string) =>
    setEnabled((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleSave = () => {
    toast({
      title: `${activeTab.label} saved`,
      description: "Your changes are live for every user of this school.",
      variant: "success",
    });
  };

  const handleReset = () => {
    setProfile(PROFILE_DEFAULTS);
    setBranding(BRANDING_DEFAULTS);
    setSession(SESSION_DEFAULTS);
    setNotifications(NOTIFICATION_DEFAULTS);
    setEnabled(["razorpay", "whatsapp", "msg91", "gsuite", "tally"]);
    toast({
      title: "Settings reset",
      description: "All sections were restored to their saved values.",
      variant: "info",
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        description="School profile, branding, session calendar, alerts and connected apps."
        actions={
          <>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
            <Button onClick={handleSave}>
              <Save className="size-4" />
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Academic session" value={session.session} icon={CalendarRange} tone="indigo" />
        <StatCard label="Connected apps" value={enabled.length} suffix={` / ${INTEGRATIONS.length}`} icon={Plug} tone="emerald" />
        <StatCard label="Alert channel" value={notifications.channel === "whatsapp" ? "WhatsApp" : "SMS"} icon={Bell} tone="amber" />
        <StatCard label="Config health" value="Healthy" icon={ShieldCheck} tone="cyan" sub="Last audited today" />
      </div>

      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex flex-wrap gap-1 rounded-md bg-surface-sunken p-1"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={`focus-ring inline-flex items-center gap-2 rounded-sm px-4 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-text">School profile</h2>
              <p className="mt-0.5 text-xs text-muted">
                Printed on report cards, receipts and transfer certificates.
              </p>
            </div>
            <Badge variant="info">Public</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              label="School name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="School code"
              value={profile.code}
              onChange={(e) => setProfile({ ...profile, code: e.target.value })}
              hint="Used as the prefix for admission numbers."
            />
            <Input
              label="Affiliation"
              value={profile.affiliation}
              onChange={(e) => setProfile({ ...profile, affiliation: e.target.value })}
            />
            <Input
              label="Principal"
              value={profile.principal}
              onChange={(e) => setProfile({ ...profile, principal: e.target.value })}
            />
            <Input
              label="Office email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <Input
              label="Office phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
            <Select
              label="Board"
              value={profile.board}
              onChange={(e) => setProfile({ ...profile, board: e.target.value })}
              options={[
                { label: "CBSE", value: "cbse" },
                { label: "ICSE / CISCE", value: "icse" },
                { label: "State Board", value: "state" },
                { label: "IB", value: "ib" },
              ]}
            />
            <Select
              label="Medium of instruction"
              value={profile.medium}
              onChange={(e) => setProfile({ ...profile, medium: e.target.value })}
              options={[
                { label: "English", value: "english" },
                { label: "Hindi", value: "hindi" },
                { label: "Bilingual", value: "bilingual" },
              ]}
            />
            <div className="lg:col-span-2">
              <Textarea
                label="Registered address"
                rows={3}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "branding" && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-text">Branding</h2>
              <p className="mt-0.5 text-xs text-muted">
                How the portal and printed documents look to parents.
              </p>
            </div>
            <Badge variant="default">Theme: {branding.theme}</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              label="Display name"
              value={branding.displayName}
              onChange={(e) => setBranding({ ...branding, displayName: e.target.value })}
              hint="Shown in the sidebar and browser tab."
            />
            <Input
              label="Tagline"
              value={branding.tagline}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
            />
            <Select
              label="Accent theme"
              value={branding.theme}
              onChange={(e) => setBranding({ ...branding, theme: e.target.value })}
              options={THEME_OPTIONS}
            />
            <Select
              label="Layout density"
              value={branding.density}
              onChange={(e) => setBranding({ ...branding, density: e.target.value })}
              options={[
                { label: "Comfortable", value: "comfortable" },
                { label: "Compact", value: "compact" },
              ]}
            />
            <div className="lg:col-span-2">
              <Textarea
                label="Receipt footer"
                rows={3}
                value={branding.receiptFooter}
                onChange={(e) => setBranding({ ...branding, receiptFooter: e.target.value })}
                hint="Appears at the bottom of every fee receipt PDF."
              />
            </div>
            <div className="lg:col-span-2">
              <Field label="Preview">
                <div className="rounded-md border border-border bg-surface-sunken p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md text-white gradient-indigo">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">
                        {branding.displayName}
                      </p>
                      <p className="truncate text-xs text-muted">{branding.tagline}</p>
                    </div>
                  </div>
                </div>
              </Field>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "session" && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-text">Academic session</h2>
              <p className="mt-0.5 text-xs text-muted">
                Drives attendance registers, term exams and fee schedules.
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              label="Session label"
              value={session.session}
              onChange={(e) => setSession({ ...session, session: e.target.value })}
            />
            <Select
              label="Terms per year"
              value={session.terms}
              onChange={(e) => setSession({ ...session, terms: e.target.value })}
              options={[
                { label: "2 terms", value: "2" },
                { label: "3 terms", value: "3" },
                { label: "4 quarters", value: "4" },
              ]}
            />
            <Input
              label="Session starts"
              type="date"
              value={session.startDate}
              onChange={(e) => setSession({ ...session, startDate: e.target.value })}
            />
            <Input
              label="Session ends"
              type="date"
              value={session.endDate}
              onChange={(e) => setSession({ ...session, endDate: e.target.value })}
            />
            <Select
              label="Weekly off"
              value={session.weekOff}
              onChange={(e) => setSession({ ...session, weekOff: e.target.value })}
              options={[
                { label: "Sunday", value: "sunday" },
                { label: "Saturday & Sunday", value: "weekend" },
                { label: "Sunday & 2nd Saturday", value: "sunday-2sat" },
              ]}
            />
            <Select
              label="Attendance mode"
              value={session.attendanceMode}
              onChange={(e) => setSession({ ...session, attendanceMode: e.target.value })}
              options={[
                { label: "Once daily", value: "daily" },
                { label: "Period-wise", value: "period" },
                { label: "Twice daily", value: "twice" },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {tab === "notifications" && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-text">Notifications</h2>
              <p className="mt-0.5 text-xs text-muted">
                Automated alerts sent to parents and staff.
              </p>
            </div>
            <Tooltip content="DLT templates must be approved before SMS goes out" side="left">
              <span>
                <Badge variant="warning">DLT registered</Badge>
              </span>
            </Tooltip>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Select
              label="Primary channel"
              value={notifications.channel}
              onChange={(e) => setNotifications({ ...notifications, channel: e.target.value })}
              options={[
                { label: "WhatsApp", value: "whatsapp" },
                { label: "SMS", value: "sms" },
                { label: "Email", value: "email" },
                { label: "In-app only", value: "inapp" },
              ]}
            />
            <Input
              label="Sender ID"
              value={notifications.senderId}
              onChange={(e) => setNotifications({ ...notifications, senderId: e.target.value })}
              hint="6-character DLT-approved header."
            />
            <Select
              label="Fee reminder lead time"
              value={notifications.feeReminderDays}
              onChange={(e) =>
                setNotifications({ ...notifications, feeReminderDays: e.target.value })
              }
              options={[
                { label: "1 day before due date", value: "1" },
                { label: "3 days before due date", value: "3" },
                { label: "7 days before due date", value: "7" },
              ]}
            />
            <Select
              label="Absentee alert"
              value={notifications.absentAlert}
              onChange={(e) => setNotifications({ ...notifications, absentAlert: e.target.value })}
              options={[
                { label: "Immediately after roll call", value: "immediate" },
                { label: "Consolidated at 11 AM", value: "morning" },
                { label: "End of day", value: "eod" },
              ]}
            />
            <div className="lg:col-span-2">
              <Textarea
                label="Principal digest rule"
                rows={3}
                value={notifications.digest}
                onChange={(e) => setNotifications({ ...notifications, digest: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "integrations" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {INTEGRATIONS.map((app) => {
            const on = enabled.includes(app.id);
            return (
              <Card key={app.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-text">{app.name}</p>
                        <Badge variant={app.variant}>{app.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">{app.detail}</p>
                    </div>
                    <Badge variant="outline">{app.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="truncate text-xs text-subtle">{app.account}</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-muted">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleIntegration(app.id)}
                        className="focus-ring size-4 cursor-pointer rounded-sm accent-primary"
                        aria-label={`Enable ${app.name}`}
                      />
                      {on ? "Enabled" : "Disabled"}
                    </label>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 className="size-4 text-success" />
            Last saved by Dr. Priya Sharma on 21 Jul 2026, 10:42 AM
          </p>
          <Button onClick={handleSave}>
            <Save className="size-4" />
            Save {activeTab.label}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
