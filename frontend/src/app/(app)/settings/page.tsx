"use client";

import React, { useEffect, useState } from "react";
import { getMySchool, updateMySchool, resetSchoolData } from "@/lib/api/schools";
import { updateMyName, updateMyProfile, changeMyPassword } from "@/lib/api/auth";
import { useAuthStore } from "@/store";
import { fileToDataUrl } from "@/lib/image";
import {
  DEFAULT_GRADING_SCHEME,
  effectiveScheme,
  validateGradingScheme,
  type GradingScheme,
} from "@/lib/grading";
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarRange,
  FileText,
  GraduationCap,
  Loader2,
  Palette,
  Plug,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
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
  { id: "grading", label: "Grading", icon: GraduationCap },
  { id: "reportcard", label: "Report Card", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PROFILE_DEFAULTS = {
  name: "",
  code: "",
  affiliation: "",
  principal: "",
  email: "",
  phone: "",
  board: "cbse",
  medium: "english",
  address: "",
  city: "",
  state: "",
  openingTime: "08:00",
  closingTime: "15:00",
  website: "",
  logo: "",
  signatureUrl: "",
};

const BRANDING_DEFAULTS = {
  displayName: "",
  tagline: "",
  theme: "indigo",
  density: "comfortable",
  receiptFooter: "",
  whiteLabel: false,
};

const SESSION_DEFAULTS = {
  session: "",
  startDate: "",
  endDate: "",
  terms: "3",
  weekOff: "sunday",
  attendanceMode: "period",
};

const NOTIFICATION_DEFAULTS = {
  channel: "whatsapp",
  feeReminderDays: "3",
  absentAlert: "immediate",
  senderId: "",
  digest: "",
};

const REPORTCARD_DEFAULTS = {
  title: "Report Card",
  subtitle: "",
  footerNote: "",
  principalName: "",
  classTeacherLabel: "Class Teacher",
  showAttendance: true,
  showRank: true,
  showGradePoint: true,
  showRemarks: true,
  showSignatures: true,
};

const THEME_OPTIONS = [
  { label: "Indigo (default)", value: "indigo" },
  { label: "Emerald", value: "emerald" },
  { label: "Violet", value: "violet" },
  { label: "Cyan", value: "cyan" },
];

type Integration = {
  id: string;
  name: string;
  category: string;
  detail: string;
  status: string;
  variant: "default" | "success" | "warning";
  account: string;
};

const INTEGRATIONS: Integration[] = [];

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, updateUser } = useAuthStore();

  // Office roles manage the whole school; everyone else sees only "My profile".
  const canManageSchool = ["super_admin", "school_admin", "principal"].includes(
    user?.role ?? ""
  );
  // Wiping all school data is an account-owner action — a principal manages the
  // school but cannot reset it.
  const canResetData = ["super_admin", "school_admin"].includes(user?.role ?? "");

  // The signed-in user's own display name (header + dashboard greeting).
  const [accountName, setAccountName] = useState("");
  useEffect(() => {
    if (!user?.name) return;
    // Deferred to keep setState out of the effect body (cascading-render rule).
    const t = setTimeout(() => setAccountName(user.name), 0);
    return () => clearTimeout(t);
  }, [user?.name]);

  const [tab, setTab] = useState<TabId>("profile");
  const [profile, setProfile] = useState(PROFILE_DEFAULTS);
  const [branding, setBranding] = useState(BRANDING_DEFAULTS);
  const [session, setSession] = useState(SESSION_DEFAULTS);
  const [notifications, setNotifications] = useState(NOTIFICATION_DEFAULTS);
  const [grading, setGrading] = useState<GradingScheme>(DEFAULT_GRADING_SCHEME);
  const [reportCard, setReportCard] = useState(REPORTCARD_DEFAULTS);
  const [enabled, setEnabled] = useState<string[]>([]);

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const [saving, setSaving] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Accepts an image only, caps the raw file size, then downscales to a compact
  // data URL. Held in profile state and persisted with the School Profile save,
  // so one upload reflects on every student and staff ID card.
  const handleSignature = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Not an image",
        description: "Please choose a PNG or JPG signature image.",
        variant: "error",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please choose a signature image under 5 MB.",
        variant: "error",
      });
      return;
    }
    setUploadingSig(true);
    try {
      const dataUrl = await fileToDataUrl(file, 400);
      setProfile((prev) => ({ ...prev, signatureUrl: dataUrl }));
    } catch (e) {
      toast({
        title: "Could not add signature",
        description: e instanceof Error ? e.message : "Please try another image.",
        variant: "error",
      });
    } finally {
      setUploadingSig(false);
    }
  };

  // School logo — image only, capped at ~2 MB raw, then downscaled to a compact
  // data URL. Held in profile state and persisted with the School Profile save,
  // so the real logo flows to the admission form, ID cards and certificates.
  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Not an image",
        description: "Please choose a PNG or JPG logo image.",
        variant: "error",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please choose a logo image under 2 MB.",
        variant: "error",
      });
      return;
    }
    setUploadingLogo(true);
    try {
      const dataUrl = await fileToDataUrl(file, 400);
      setProfile((prev) => ({ ...prev, logo: dataUrl }));
    } catch (e) {
      toast({
        title: "Could not add logo",
        description: e instanceof Error ? e.message : "Please try another image.",
        variant: "error",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Danger zone — wipe all school data for a clean slate.
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleResetData = async () => {
    setResetting(true);
    try {
      const res = await resetSchoolData();
      toast({
        title: "School data cleared",
        description: `${res.removed} record${res.removed === 1 ? "" : "s"} removed. The app will reload.`,
      });
      setResetOpen(false);
      // Reload so every page reflects the now-empty data.
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      toast({
        title: "Could not reset data",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
      setResetting(false);
    }
  };

  // Load the real school profile (skips the platform owner / no-tenant case).
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      getMySchool()
        .then((s) => {
          if (cancelled || !s) return;
          setProfile((prev) => ({
            ...prev,
            name: s.name || prev.name,
            principal: s.ownerName || prev.principal,
            email: s.email || prev.email,
            phone: s.phone || prev.phone,
            address: s.address || prev.address,
            city: s.city || prev.city,
            state: s.state || prev.state,
            openingTime: s.openingTime || prev.openingTime,
            closingTime: s.closingTime || prev.closingTime,
            website: s.website || prev.website,
            affiliation: s.affiliation || prev.affiliation,
            logo: s.logo || prev.logo,
            signatureUrl: s.signatureUrl || prev.signatureUrl,
          }));
          setBranding((prev) => ({
            ...prev,
            displayName: s.displayName || prev.displayName,
            tagline: s.tagline || prev.tagline,
            theme: s.theme || prev.theme,
            density: s.density || prev.density,
            receiptFooter: s.receiptFooter || prev.receiptFooter,
            whiteLabel: Boolean(s.whiteLabel),
          }));
          setSession((prev) => ({
            ...prev,
            session: s.sessionLabel || prev.session,
            startDate: s.sessionStartDate || prev.startDate,
            endDate: s.sessionEndDate || prev.endDate,
            terms: s.terms || prev.terms,
            weekOff: s.weekOff || prev.weekOff,
            attendanceMode: s.attendanceMode || prev.attendanceMode,
          }));
          setNotifications((prev) => ({
            ...prev,
            channel: s.notifChannel || prev.channel,
            senderId: s.notifSenderId || prev.senderId,
            feeReminderDays: s.notifFeeReminderDays || prev.feeReminderDays,
            absentAlert: s.notifAbsentAlert || prev.absentAlert,
            digest: s.notifDigest || prev.digest,
          }));
          setGrading(effectiveScheme(s.gradingScheme));
          setReportCard((prev) => ({ ...prev, ...(s.reportCardTemplate ?? {}) }));
        })
        .catch(() => {});
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const toggleIntegration = (id: string) =>
    setEnabled((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};

      if (tab === "profile") {
        Object.assign(updates, {
          name: profile.name,
          ownerName: profile.principal,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          openingTime: profile.openingTime || "08:00",
          closingTime: profile.closingTime || "15:00",
          website: profile.website,
          affiliation: profile.affiliation,
          logo: profile.logo,
          signatureUrl: profile.signatureUrl,
        });
        // Also update the signed-in user's own display name.
        const newName = accountName.trim();
        if (newName && newName !== (user?.name ?? "")) {
          try {
            const updated = await updateMyName(newName);
            updateUser({ name: updated.name });
          } catch { /* older backend */ }
        }
      } else if (tab === "branding") {
        Object.assign(updates, {
          displayName: branding.displayName,
          tagline: branding.tagline,
          theme: branding.theme,
          density: branding.density,
          receiptFooter: branding.receiptFooter,
          whiteLabel: branding.whiteLabel,
        });
      } else if (tab === "session") {
        Object.assign(updates, {
          sessionLabel: session.session,
          sessionStartDate: session.startDate,
          sessionEndDate: session.endDate,
          terms: session.terms,
          weekOff: session.weekOff,
          attendanceMode: session.attendanceMode,
        });
      } else if (tab === "notifications") {
        Object.assign(updates, {
          notifChannel: notifications.channel,
          notifSenderId: notifications.senderId,
          notifFeeReminderDays: notifications.feeReminderDays,
          notifAbsentAlert: notifications.absentAlert,
          notifDigest: notifications.digest,
        });
      } else if (tab === "grading") {
        if (!validateGradingScheme(grading.bands)) {
          toast({
            title: "Grade bands aren't valid",
            description: "Bands must cover 0–100% with no gaps or overlaps.",
            variant: "error",
          });
          setSaving(false);
          return;
        }
        updates.gradingScheme = grading;
      } else if (tab === "reportcard") {
        updates.reportCardTemplate = reportCard;
      }

      if (Object.keys(updates).length > 0) {
        await updateMySchool(updates);
      }

      toast({ title: `${activeTab.label} saved`, description: "Your changes are live.", variant: "success" });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setProfile(PROFILE_DEFAULTS);
    setBranding(BRANDING_DEFAULTS);
    setSession(SESSION_DEFAULTS);
    setNotifications(NOTIFICATION_DEFAULTS);
    setGrading(DEFAULT_GRADING_SCHEME);
    setEnabled([]);
    toast({
      title: "Settings reset",
      description: "All sections were restored to their saved values.",
      variant: "info",
    });
  };

  // ── Self-service "My profile" ───────────────────────────────────────────────
  // Non-office roles (teachers, accountants, librarians, parents, students, …)
  // never see school configuration — only their own name, photo and password.
  const [profileAvatar, setProfileAvatar] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>(
    {}
  );
  const [changingPassword, setChangingPassword] = useState(false);

  // Prefill the photo from the signed-in user. Deferred to keep setState out of
  // the effect body (same cascading-render guard as the account-name effect).
  useEffect(() => {
    const t = setTimeout(() => setProfileAvatar(user?.avatar ?? ""), 0);
    return () => clearTimeout(t);
  }, [user?.avatar]);

  // Pick a profile photo — image only, capped ~2 MB raw, then downscaled to a
  // compact data URL held in state for the preview and the save.
  const handleAvatar = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Not an image",
        description: "Please choose a PNG or JPG photo.",
        variant: "error",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please choose a photo under 2 MB.",
        variant: "error",
      });
      return;
    }
    setUploadingAvatar(true);
    try {
      const dataUrl = await fileToDataUrl(file, 400);
      setProfileAvatar(dataUrl);
    } catch (e) {
      toast({
        title: "Could not add photo",
        description: e instanceof Error ? e.message : "Please try another image.",
        variant: "error",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save the signed-in user's own name + photo, then refresh the header/greeting.
  const handleSaveProfile = async () => {
    const name = accountName.trim();
    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter your display name.",
        variant: "error",
      });
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile({ name, avatar: profileAvatar });
      updateUser(updated);
      toast({ title: "Profile saved", description: "Your changes are live.", variant: "success" });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password — validate client-side (match + min length) before calling
  // the API; the server verifies the current password and may reject it.
  const handleChangePassword = async () => {
    const errors: { current?: string; next?: string; confirm?: string } = {};
    if (!currentPassword) errors.current = "Enter your current password.";
    if (newPassword.length < 8) errors.next = "Use at least 8 characters.";
    if (newPassword !== confirmPassword) errors.confirm = "Passwords do not match.";
    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }
    setPwErrors({});
    setChangingPassword(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        description: "Use your new password next time you sign in.",
        variant: "success",
      });
    } catch (e) {
      toast({
        title: "Could not update password",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Non-office roles get ONLY this self-service view — no school config, no tabs,
  // no danger zone.
  if (!canManageSchool) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          title="My profile"
          description="Update your display name, photo and password."
        />

        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-text">My profile</h2>
              <p className="mt-0.5 text-xs text-muted">
                Shown in the top bar and the dashboard greeting.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field label="Profile photo" hint="A square PNG or JPG works best. Max 2 MB.">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar
                  name={accountName || user?.name || "You"}
                  src={profileAvatar || undefined}
                  size="xl"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="focus-within:outline-none">
                    <span className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-hover">
                      <Upload className="size-4" />
                      {uploadingAvatar
                        ? "Processing…"
                        : profileAvatar
                          ? "Change photo"
                          : "Upload photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploadingAvatar}
                      onChange={(e) => {
                        handleAvatar(e.target.files?.[0]);
                        e.target.value = ""; // allow re-selecting the same file
                      }}
                    />
                  </label>
                  {profileAvatar && (
                    <Button type="button" variant="ghost" onClick={() => setProfileAvatar("")}>
                      <X className="size-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input
                label="Display name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                hint="Shown in the top bar and the dashboard greeting."
              />
              <Input
                label="Login email"
                value={user?.email ?? ""}
                disabled
                hint="Contact your school admin to change other details."
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={savingProfile || uploadingAvatar}>
                <Save className="size-4" />
                {savingProfile ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-text">Change password</h2>
              <p className="mt-0.5 text-xs text-muted">
                Choose a new password with at least 8 characters.
              </p>
            </div>
            <ShieldCheck className="size-4 text-muted" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={pwErrors.current}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={pwErrors.next}
                hint="At least 8 characters."
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={pwErrors.confirm}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                <ShieldCheck className="size-4" />
                {changingPassword ? "Updating…" : "Update password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Button onClick={handleSave} disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving…" : "Save changes"}
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
       <>
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-text">Your account</h2>
              <p className="mt-0.5 text-xs text-muted">
                Shown in the top bar and the dashboard greeting.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              label="Your name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              hint="This is you — separate from the principal's name below."
            />
            <Input label="Login email" value={user?.email ?? ""} disabled hint="Your sign-in email can't be changed here." />
          </CardContent>
        </Card>

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
            <Input
              label="City"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            />
            <Input
              label="State"
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
            />
            <Input
              label="Opening time"
              type="time"
              value={profile.openingTime}
              onChange={(e) => setProfile({ ...profile, openingTime: e.target.value })}
              hint="When the school day starts — drives the dashboard Open/Closed badge."
            />
            <Input
              label="Closing time"
              type="time"
              value={profile.closingTime}
              onChange={(e) => setProfile({ ...profile, closingTime: e.target.value })}
              hint="When the school day ends."
            />
            <div className="lg:col-span-2">
              <Input
                label="Website"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                hint="Shown on the admission form, ID cards and certificates."
              />
            </div>
            <div className="lg:col-span-2">
              <Textarea
                label="Registered address"
                rows={3}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
            <div className="lg:col-span-2">
              <Field
                label="School logo"
                hint="Appears on the admission form, ID cards and certificates. A square PNG or JPG works best. Max 2 MB."
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white">
                    {profile.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.logo}
                        alt="School logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="px-1 text-center text-xs text-subtle">No logo</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="focus-within:outline-none">
                      <span className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-hover">
                        <Upload className="size-4" />
                        {uploadingLogo
                          ? "Processing…"
                          : profile.logo
                            ? "Change logo"
                            : "Upload logo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingLogo}
                        onChange={(e) => {
                          handleLogo(e.target.files?.[0]);
                          e.target.value = ""; // allow re-selecting the same file
                        }}
                      />
                    </label>
                    {profile.logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setProfile({ ...profile, logo: "" })}
                      >
                        <X className="size-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </Field>
            </div>
            <div className="lg:col-span-2">
              <Field
                label="Authorised signature"
                hint="Printed in the signature area of every student and staff ID card. A PNG or JPG on a white background works best. Max 5 MB."
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white">
                    {profile.signatureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.signatureUrl}
                        alt="School signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-subtle">No signature</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="focus-within:outline-none">
                      <span className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-hover">
                        <Upload className="size-4" />
                        {uploadingSig
                          ? "Processing…"
                          : profile.signatureUrl
                            ? "Change signature"
                            : "Upload signature"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingSig}
                        onChange={(e) => {
                          handleSignature(e.target.files?.[0]);
                          e.target.value = ""; // allow re-selecting the same file
                        }}
                      />
                    </label>
                    {profile.signatureUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setProfile({ ...profile, signatureUrl: "" })}
                      >
                        <X className="size-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </Field>
            </div>
          </CardContent>
        </Card>
       </>
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
              <label className="flex items-start gap-3 rounded-md border border-border bg-surface p-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={branding.whiteLabel}
                  onChange={(e) => setBranding({ ...branding, whiteLabel: e.target.checked })}
                />
                <span className="text-sm">
                  <span className="font-medium text-text">White-label</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Show your school&apos;s logo and name in the app instead of SchoolDeck. Upload your
                    logo in School Profile; it then appears in the sidebar and on documents.
                  </span>
                </span>
              </label>
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

      {tab === "grading" && (
        <Card>
          <CardHeader className="flex-col items-stretch gap-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-text">Grading scheme</h2>
              <Badge variant={validateGradingScheme(grading.bands) ? "success" : "danger"}>
                {validateGradingScheme(grading.bands) ? "Valid" : "Fix bands"}
              </Badge>
            </div>
            <p className="text-xs text-muted">
              The grade bands used across mark entry, report cards, merit lists and the parent
              portal. Grades are derived from these, so editing a band re-grades existing results.
              Bands must cover 0–100% with no gaps or overlaps.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Pass mark (%)">
                <Input
                  type="number"
                  className="w-28"
                  value={String(grading.passPercent)}
                  onChange={(e) => setGrading({ ...grading, passPercent: Number(e.target.value) || 0 })}
                />
              </Field>
              <label className="flex items-center gap-2 pb-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={grading.enabled}
                  onChange={(e) => setGrading({ ...grading, enabled: e.target.checked })}
                />
                Show grades on documents
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setGrading(DEFAULT_GRADING_SCHEME)}
              >
                <RotateCcw className="size-3.5" /> CBSE default
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-2 py-1 font-medium">Grade</th>
                    <th className="px-2 py-1 font-medium">Min %</th>
                    <th className="px-2 py-1 font-medium">Max %</th>
                    <th className="px-2 py-1 font-medium">Grade point</th>
                    <th className="px-2 py-1 font-medium">Remark</th>
                    <th className="px-2 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {grading.bands.map((b, i) => {
                    const edit = (patch: Partial<typeof b>) =>
                      setGrading({
                        ...grading,
                        bands: grading.bands.map((x, idx) => (idx === i ? { ...x, ...patch } : x)),
                      });
                    return (
                      <tr key={i} className="border-t border-border">
                        <td className="px-2 py-1.5">
                          <Input className="w-16" value={b.grade} onChange={(e) => edit({ grade: e.target.value })} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input type="number" className="w-20" value={String(b.minPercent)} onChange={(e) => edit({ minPercent: Number(e.target.value) || 0 })} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input type="number" className="w-20" value={String(b.maxPercent)} onChange={(e) => edit({ maxPercent: Number(e.target.value) || 0 })} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input type="number" className="w-20" value={String(b.gradePoint)} onChange={(e) => edit({ gradePoint: Number(e.target.value) || 0 })} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input value={b.remark} onChange={(e) => edit({ remark: e.target.value })} />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => setGrading({ ...grading, bands: grading.bands.filter((_, idx) => idx !== i) })}
                            aria-label={`Remove ${b.grade || "band"}`}
                            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setGrading({
                  ...grading,
                  bands: [...grading.bands, { grade: "", minPercent: 0, maxPercent: 0, gradePoint: 0, remark: "" }],
                })
              }
            >
              <Plus className="size-3.5" /> Add band
            </Button>

            {!validateGradingScheme(grading.bands) && (
              <p className="text-xs text-danger-text">
                Bands must be contiguous and cover 0–100% exactly (e.g. 0–32, 33–40, 41–50 … 91–100),
                sorted with no gaps or overlaps.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "reportcard" && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-text">Report card template</h2>
              <p className="mt-0.5 text-xs text-muted">
                The layout every student&apos;s report card uses. The header (school name, logo,
                affiliation, signature) comes from your School Profile.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              label="Title"
              value={reportCard.title}
              onChange={(e) => setReportCard({ ...reportCard, title: e.target.value })}
              hint={'e.g. "Report Card" or "Progress Report"'}
            />
            <Input
              label="Subtitle (optional)"
              value={reportCard.subtitle}
              onChange={(e) => setReportCard({ ...reportCard, subtitle: e.target.value })}
              hint="Shown under the title."
            />
            <Input
              label="Principal name"
              value={reportCard.principalName}
              onChange={(e) => setReportCard({ ...reportCard, principalName: e.target.value })}
              hint="Printed under the principal's signature."
            />
            <Input
              label="Class-teacher signature label"
              value={reportCard.classTeacherLabel}
              onChange={(e) => setReportCard({ ...reportCard, classTeacherLabel: e.target.value })}
            />
            <div className="lg:col-span-2">
              <Textarea
                label="Footer note"
                rows={2}
                value={reportCard.footerNote}
                onChange={(e) => setReportCard({ ...reportCard, footerNote: e.target.value })}
                hint="A disclaimer printed at the bottom, e.g. “Computer-generated report card.”"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:col-span-2">
              {(
                [
                  ["showAttendance", "Show attendance %"],
                  ["showRank", "Show class rank"],
                  ["showGradePoint", "Show grade point"],
                  ["showRemarks", "Show remarks"],
                  ["showSignatures", "Show signatures"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={reportCard[key]}
                    onChange={(e) => setReportCard({ ...reportCard, [key]: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-text">{label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted lg:col-span-2">
              Saved once here — the same template is used for every student&apos;s report card.
            </p>
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

      {tab === "integrations" && INTEGRATIONS.length === 0 && (
        <Card>
          <EmptyState
            title="No integrations connected"
            description="Connect payment, messaging and identity apps to see them here."
            icon={<Plug className="size-5" />}
          />
        </Card>
      )}

      {tab === "integrations" && INTEGRATIONS.length > 0 && (
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
        <CardContent className="flex flex-wrap items-center justify-end gap-3">
          <Button onClick={handleSave}>
            <Save className="size-4" />
            Save {activeTab.label}
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone — clear all school data (account owner only; a principal manages the school but can't reset it) */}
      {canResetData && (
      <Card className="border-danger/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-danger" />
            <h2 className="text-sm font-semibold text-text">Danger zone</h2>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text">Reset all school data</p>
            <p className="mt-0.5 text-xs text-muted">
              Permanently deletes every student, teacher, staff, fee, class, exam, event and other
              record for this school. Your login and school account are kept. This cannot be undone.
            </p>
          </div>
          <Button variant="danger" onClick={() => { setResetText(""); setResetOpen(true); }}>
            <Trash2 className="size-4" />
            Reset data
          </Button>
        </CardContent>
      </Card>
      )}

      <Modal
        open={resetOpen}
        onOpenChange={(o) => !resetting && setResetOpen(o)}
        title="Reset all school data?"
        description="This permanently deletes ALL records for your school. Type RESET to confirm."
        footer={
          <>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetData} disabled={resetting || resetText !== "RESET"}>
              {resetting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {resetting ? "Clearing…" : "Delete everything"}
            </Button>
          </>
        }
      >
        <Input
          label='Type "RESET" to confirm'
          value={resetText}
          onChange={(e) => setResetText(e.target.value)}
          placeholder="RESET"
          autoFocus
        />
      </Modal>
    </div>
  );
}
