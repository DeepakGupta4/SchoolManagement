import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText, Card, StatCard, DashboardScreen, HeroAction, NoticeCard } from "@/components";
import { getStaffMe, type StaffMe } from "@/api/portal";
import { getFeeSummary, listPayments, inr, type FeeSummary, type Payment } from "@/api/finance";
import { getMySchool, type School } from "@/api/schools";
import { listHolidays, type Holiday } from "@/api/updates";
import { computeSchoolStatus } from "@/lib/schoolStatus";
import { prettyDate } from "@/lib/date";
import { ApiError } from "@/api/client";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

type QuickAction = { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; bg: string; fg: string };
const ACTIONS: QuickAction[] = [
  { label: "Payments", icon: "receipt-outline", href: "/accountant/payments", bg: colors.primarySoft, fg: colors.primaryText },
  { label: "Fee dues", icon: "alert-circle-outline", href: "/accountant/dues", bg: colors.warningSoft, fg: colors.warningText },
  { label: "Report cards", icon: "ribbon-outline", href: "/accountant/report-cards", bg: colors.successSoft, fg: colors.successText },
  { label: "Admit cards", icon: "reader-outline", href: "/accountant/admit-cards", bg: colors.infoSoft, fg: colors.infoText },
  { label: "Message board", icon: "chatbubbles-outline", href: "/accountant/messages", bg: colors.primarySoft, fg: colors.primaryText },
  { label: "My leave", icon: "calendar-clear-outline", href: "/accountant/leave", bg: colors.warningSoft, fg: colors.warningText },
];

const STATUS_TONE: Record<string, { bg: string; fg: string; label: string }> = {
  paid: { bg: colors.successSoft, fg: colors.successText, label: "Paid" },
  "pending-clearance": { bg: colors.warningSoft, fg: colors.warningText, label: "Pending" },
  bounced: { bg: colors.dangerSoft, fg: colors.dangerText, label: "Bounced" },
  cancelled: { bg: colors.surfaceAlt, fg: colors.muted, label: "Cancelled" },
};

/** Accountant home: fee day-book — KPIs, today-by-mode, recent payments, actions. */
export default function AccountantHome() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const unread = useNotifications((s) => s.unread);
  const refreshAlerts = useNotifications((s) => s.refresh);
  const [me, setMe] = useState<StaffMe | null>(null);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [staff, sum, pays, hol, sch] = await Promise.all([
        getStaffMe().catch(() => null),
        getFeeSummary().catch((e) => {
          setError(e instanceof ApiError ? e.message : "Could not load the fee figures.");
          return null;
        }),
        listPayments().catch(() => [] as Payment[]),
        listHolidays().catch(() => [] as Holiday[]),
        getMySchool().catch(() => null),
      ]);
      setMe(staff);
      setSummary(sum);
      setPayments(pays);
      setHolidays(hol);
      setSchool(sch);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      refreshAlerts();
    }, [load, refreshAlerts])
  );

  const name = me?.profile.name || user?.name || "Accountant";
  const meta = me ? [me.profile.role || "Accountant", me.profile.dept].filter(Boolean).join(" · ") : "Accountant";

  // Same Open/Closed rule as the website (Sunday/holiday + school hours).
  const schoolStatus = useMemo(
    () => computeSchoolStatus({ openingTime: school?.openingTime, closingTime: school?.closingTime, holidays }),
    [school, holidays]
  );

  // Today's collection split by instrument (Cash/UPI/…), non-zero only.
  const modeRows = useMemo(() => {
    const by = summary?.byMode ?? {};
    return Object.keys(by)
      .map((mode) => ({ mode, amount: by[mode] ?? 0 }))
      .filter((r) => r.amount > 0);
  }, [summary]);

  const recent = useMemo(
    () => [...payments].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 6),
    [payments]
  );

  const headerActions = (
    <View style={styles.heroActions}>
      <HeroAction icon="sparkles-outline" onPress={() => router.push("/accountant/assistant")} accessibilityLabel="AI assistant" />
      <HeroAction
        icon="notifications-outline"
        badge={unread ? (unread > 9 ? "9+" : unread) : undefined}
        onPress={() => router.push("/accountant/notifications")}
        accessibilityLabel={unread ? `Alerts, ${unread} unread` : "Alerts"}
      />
    </View>
  );

  return (
    <DashboardScreen
      name={name}
      avatarUri={me?.profile.avatar || user?.avatar || undefined}
      meta={meta}
      rightSlot={headerActions}
      status={schoolStatus}
      loading={loading && !summary && !me}
    >
      {!summary && error ? (
        <NoticeCard error={error} emptyText="" onRetry={load} />
      ) : null}

      {/* Day-book KPIs */}
      <View style={styles.statRow}>
        <StatCard label="Collected today" value={inr(summary?.collectedToday)} icon="wallet-outline" tone="success" onPress={() => router.push("/accountant/payments")} />
        <StatCard label="Total collected" value={inr(summary?.totalCollected)} icon="cash-outline" tone="primary" onPress={() => router.push("/accountant/payments")} />
      </View>
      <View style={styles.statRow}>
        <StatCard label="Outstanding" value={inr(summary?.outstanding)} icon="alert-circle-outline" tone="warning" onPress={() => router.push("/accountant/dues")} />
        <StatCard
          label="Timetable"
          value={new Date().toLocaleDateString("en-US", { weekday: "short" })}
          icon="calendar-outline"
          tone="info"
          onPress={() => router.push("/accountant/timetable")}
        />
      </View>

      {/* Today by mode */}
      {modeRows.length > 0 ? (
        <Card style={styles.block}>
          <AppText variant="heading">Today by mode</AppText>
          <View style={styles.modeGrid}>
            {modeRows.map((r) => (
              <View key={r.mode} style={styles.modeTile}>
                <AppText variant="small" style={styles.modeLabel}>
                  {r.mode}
                </AppText>
                <AppText style={styles.modeValue}>{inr(r.amount)}</AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {/* Recent payments */}
      <Card style={styles.block}>
        <View style={styles.rowBetween}>
          <AppText variant="heading">Recent payments</AppText>
          <Pressable onPress={() => router.push("/accountant/payments")} hitSlop={8}>
            <AppText style={styles.link}>View all</AppText>
          </Pressable>
        </View>
        {recent.length === 0 ? (
          <AppText variant="muted">No payments recorded yet.</AppText>
        ) : (
          recent.map((p) => {
            const tone = STATUS_TONE[p.status] ?? STATUS_TONE.paid;
            const voided = p.status === "cancelled" || p.status === "bounced";
            return (
              <View key={p.id} style={styles.payRow}>
                <View style={styles.payIcon}>
                  <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText style={styles.payName} numberOfLines={1}>
                    {p.studentName || "—"}
                  </AppText>
                  <AppText variant="small" style={styles.muted} numberOfLines={1}>
                    {[p.receiptNo, p.className, p.method].filter(Boolean).join(" · ")}
                  </AppText>
                </View>
                <View style={styles.payRight}>
                  <AppText style={[styles.payAmount, voided && styles.voided]}>{inr(p.amount)}</AppText>
                  <AppText variant="small" style={styles.muted}>
                    {prettyDate(p.date)}
                  </AppText>
                </View>
              </View>
            );
          })
        )}
      </Card>

      {/* Quick actions */}
      <Card style={styles.block}>
        <AppText variant="heading">Quick actions</AppText>
        <View style={styles.actionGrid}>
          {ACTIONS.map((a) => (
            <Pressable key={a.label} style={[styles.actionTile, { backgroundColor: a.bg }]} onPress={() => router.push(a.href)}>
              <Ionicons name={a.icon} size={22} color={a.fg} />
              <AppText style={[styles.actionLabel, { color: a.fg }]}>{a.label}</AppText>
            </Pressable>
          ))}
        </View>
      </Card>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  muted: { color: colors.muted },
  heroActions: { flexDirection: "row", gap: spacing.sm },
  block: { gap: spacing.sm },
  statRow: { flexDirection: "row", gap: spacing.md },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { color: colors.primaryText, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },

  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  modeTile: { flexGrow: 1, minWidth: "30%", backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  modeLabel: { color: colors.muted },
  modeValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginTop: 2 },

  payRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs },
  payIcon: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  payName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  payRight: { alignItems: "flex-end" },
  payAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  voided: { color: colors.muted, textDecorationLine: "line-through" },

  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  actionTile: { width: "47%", flexGrow: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  actionLabel: { fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
});
