import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View, type DimensionValue } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText, Card, DashboardScreen, HeroAction, NoticeCard, Avatar } from "@/components";
import { getChildren, type ChildSummary } from "@/api/portal";
import { getMySchool, type School } from "@/api/schools";
import { listHolidays, type Holiday } from "@/api/updates";
import { computeSchoolStatus } from "@/lib/schoolStatus";
import { ApiError } from "@/api/client";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

type QuickAction = { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; bg: string; fg: string };
const ACTIONS: QuickAction[] = [
  { label: "Updates", icon: "megaphone-outline", href: "/parent/updates", bg: colors.primarySoft, fg: colors.primaryText },
  { label: "Alerts", icon: "notifications-outline", href: "/parent/notifications", bg: colors.infoSoft, fg: colors.infoText },
  { label: "Message board", icon: "chatbubbles-outline", href: "/parent/messages", bg: colors.successSoft, fg: colors.successText },
  { label: "Track the bus", icon: "bus-outline", href: "/track", bg: colors.warningSoft, fg: colors.warningText },
];

const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
function barTone(pct: number): string {
  if (pct >= 75) return colors.success;
  if (pct >= 40) return colors.warning;
  return colors.danger;
}

/** Parent home: an at-a-glance overview, quick actions, and rich child cards. */
export default function ParentHome() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const unread = useNotifications((s) => s.unread);
  const refreshAlerts = useNotifications((s) => s.refresh);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [kids, hol, sch] = await Promise.all([
        getChildren(),
        listHolidays().catch(() => [] as Holiday[]),
        getMySchool().catch(() => null),
      ]);
      setChildren(kids);
      setHolidays(hol);
      setSchool(sch);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your children.");
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

  const schoolStatus = useMemo(
    () => computeSchoolStatus({ openingTime: school?.openingTime, closingTime: school?.closingTime, holidays }),
    [school, holidays]
  );

  const summary = useMemo(() => {
    const n = children.length;
    const avgAtt = n ? Math.round(children.reduce((s, c) => s + (c.attendancePercent || 0), 0) / n) : 0;
    const due = children.reduce((s, c) => s + (c.feeDue || 0), 0);
    return { n, avgAtt, due };
  }, [children]);

  const meta = children.length ? `${children.length} ${children.length === 1 ? "child" : "children"}` : undefined;
  const headerActions = (
    <View style={styles.heroActions}>
      <HeroAction icon="sparkles-outline" onPress={() => router.push("/parent/assistant")} accessibilityLabel="AI assistant" />
      <HeroAction
        icon="notifications-outline"
        badge={unread ? (unread > 9 ? "9+" : unread) : undefined}
        onPress={() => router.push("/parent/notifications")}
        accessibilityLabel={unread ? `Alerts, ${unread} unread` : "Alerts"}
      />
    </View>
  );

  return (
    <DashboardScreen
      name={user?.name || "Parent"}
      meta={meta}
      rightSlot={headerActions}
      status={schoolStatus}
      loading={loading && children.length === 0}
      onRefresh={load}
    >
      {children.length === 0 ? (
        <NoticeCard
          error={error}
          emptyText="No children are linked to your account. Ask the office to add your email to your child's record."
          onRetry={load}
        />
      ) : (
        <>
          {/* Overview */}
          <Card style={styles.overview}>
            <Overview label="Children" value={String(summary.n)} tone={colors.primaryText} />
            <View style={styles.vDivider} />
            <Overview label="Avg attendance" value={`${summary.avgAtt}%`} tone={barTone(summary.avgAtt)} />
            <View style={styles.vDivider} />
            <Overview label="Fees due" value={inr(summary.due)} tone={summary.due > 0 ? colors.dangerText : colors.successText} />
          </Card>

          {/* Quick actions */}
          <View style={styles.actionGrid}>
            {ACTIONS.map((a) => (
              <Pressable key={a.label} style={[styles.actionTile, { backgroundColor: a.bg }]} onPress={() => router.push(a.href)}>
                <Ionicons name={a.icon} size={22} color={a.fg} />
                <AppText style={[styles.actionLabel, { color: a.fg }]}>{a.label}</AppText>
              </Pressable>
            ))}
          </View>

          <AppText variant="heading">My children</AppText>
          {children.map((c) => (
            <ChildCard key={c.id} child={c} onPress={() => router.push({ pathname: "/parent/child", params: { id: c.id } })} />
          ))}
        </>
      )}
    </DashboardScreen>
  );
}

function Overview({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.overviewCol}>
      <AppText style={[styles.overviewValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText style={styles.overviewLabel} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

function ChildCard({ child: c, onPress }: { child: ChildSummary; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${c.name}'s report`}>
      <Card style={styles.childCard}>
        <View style={styles.top}>
          <Avatar name={c.name} uri={c.avatar} size={48} />
          <View style={styles.flex}>
            <AppText variant="heading" style={styles.name} numberOfLines={1}>
              {c.name}
            </AppText>
            <AppText variant="muted" numberOfLines={1}>
              {c.className}
              {c.section ? ` · ${c.section}` : ""}
              {c.rollNo ? ` · Roll ${c.rollNo}` : ""}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>

        <View style={styles.bars}>
          <ProgressStat label="Attendance" pct={c.attendancePercent} color={barTone(c.attendancePercent)} />
          <ProgressStat label="Performance" pct={c.performancePercent} color={colors.primary} />
        </View>

        <View style={styles.feeRow}>
          <AppText variant="small" style={styles.muted}>
            Fees
          </AppText>
          <View style={[styles.feePill, { backgroundColor: c.feeDue > 0 ? colors.dangerSoft : colors.successSoft }]}>
            <AppText variant="small" style={{ color: c.feeDue > 0 ? colors.dangerText : colors.successText, fontWeight: fontWeight.bold }}>
              {c.feeDue > 0 ? `${inr(c.feeDue)} due` : "All paid"}
            </AppText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function ProgressStat({ label, pct, color }: { label: string; pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <View style={styles.flex}>
      <View style={styles.statHead}>
        <AppText variant="small" style={styles.muted}>
          {label}
        </AppText>
        <AppText variant="small" style={[styles.statPct, { color }]}>
          {clamped}%
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` as DimensionValue, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  muted: { color: colors.muted },
  heroActions: { flexDirection: "row", gap: spacing.sm },

  overview: { flexDirection: "row", alignItems: "center" },
  overviewCol: { flex: 1, alignItems: "center", gap: 2 },
  overviewValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  overviewLabel: { fontSize: fontSize.xs, color: colors.muted },
  vDivider: { width: 1, alignSelf: "stretch", backgroundColor: colors.border, marginVertical: spacing.xs },

  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  actionTile: { width: "47%", flexGrow: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  actionLabel: { fontWeight: fontWeight.semibold, fontSize: fontSize.sm },

  childCard: { gap: spacing.md },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: fontSize.md },
  bars: { flexDirection: "row", gap: spacing.lg },
  statHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statPct: { fontWeight: fontWeight.bold },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: "hidden", marginTop: 4 },
  fill: { height: 6, borderRadius: 3 },
  feeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feePill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
});
