import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText, Card, StatCard, DashboardScreen, HeroAction, NoticeCard } from "@/components";
import { getStaffMe, type StaffMe } from "@/api/portal";
import { getMyRoute, type DriverRoute } from "@/api/transport";
import { listHolidays, type Holiday } from "@/api/updates";
import { isTracking } from "@/lib/tracking";
import { todayIso, isSundayIso } from "@/lib/date";
import { ApiError } from "@/api/client";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

type QuickAction = { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; bg: string; fg: string };
const ACTIONS: QuickAction[] = [
  { label: "Live tracking", icon: "navigate-outline", href: "/driver/tracking", bg: colors.primarySoft, fg: colors.primaryText },
  { label: "My students", icon: "people-outline", href: "/driver/students", bg: colors.infoSoft, fg: colors.infoText },
  { label: "My attendance", icon: "checkbox-outline", href: "/driver/attendance", bg: colors.successSoft, fg: colors.successText },
  { label: "My leave", icon: "calendar-clear-outline", href: "/driver/leave", bg: colors.warningSoft, fg: colors.warningText },
  { label: "Updates", icon: "megaphone-outline", href: "/driver/updates", bg: colors.primarySoft, fg: colors.primaryText },
  { label: "Message board", icon: "chatbubbles-outline", href: "/driver/messages", bg: colors.successSoft, fg: colors.successText },
];

/** Driver home: school status, their route, trip + live-share, attendance & quick actions. */
export default function DriverHome() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [me, setMe] = useState<StaffMe | null>(null);
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [staff, r, hol, on] = await Promise.all([
        getStaffMe().catch(() => null),
        // Route is the primary card — surface its failure so the retry button shows
        // (the others degrade silently).
        getMyRoute().catch((e) => {
          setError(e instanceof ApiError ? e.message : "Could not load your route.");
          return null;
        }),
        listHolidays().catch(() => [] as Holiday[]),
        isTracking().catch(() => false),
      ]);
      setMe(staff);
      setRoute(r);
      setHolidays(hol);
      setSharing(on);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const name = me?.profile.name || user?.name || "Driver";
  const meta = me ? [me.profile.role || "Driver", me.profile.dept].filter(Boolean).join(" · ") : "Driver";

  // Today's school status: Sunday or a holiday record = closed; else open.
  const todayIsoStr = useMemo(() => todayIso(), []);
  const holidayToday = useMemo(() => holidays.find((h) => h.date === todayIsoStr) ?? null, [holidays, todayIsoStr]);
  const isHoliday = isSundayIso(todayIsoStr) || !!holidayToday;
  const schoolStatus = { label: isHoliday ? "Holiday" : "Open", open: !isHoliday };

  const att = me?.attendance;

  const headerActions = (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <HeroAction icon="sparkles-outline" onPress={() => router.push("/driver/assistant")} accessibilityLabel="AI assistant" />
      <HeroAction icon="map-outline" onPress={() => router.push("/track")} accessibilityLabel="Open live map" />
    </View>
  );

  return (
    <DashboardScreen
      name={name}
      avatarUri={me?.profile.avatar || user?.avatar || undefined}
      meta={meta}
      rightSlot={headerActions}
      status={schoolStatus}
      loading={loading && !me && !route}
    >
      {/* School-closed banner */}
      {isHoliday ? (
        <Card style={styles.holiday}>
          <View style={styles.holidayIcon}>
            <Ionicons name="sunny-outline" size={22} color={colors.warningText} />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading" style={styles.holidayTitle}>
              School&apos;s closed today
            </AppText>
            <AppText variant="muted">
              {holidayToday ? holidayToday.name : "Sunday — weekly holiday"} · no trip today
            </AppText>
          </View>
        </Card>
      ) : null}

      {/* Live-sharing status → tap to go to the tracking screen */}
      <Pressable onPress={() => router.push("/driver/tracking")} accessibilityRole="button">
        <Card style={[styles.share, sharing && styles.shareOn]}>
          <View style={[styles.shareDot, { backgroundColor: sharing ? colors.success : colors.subtle }]} />
          <View style={styles.flex}>
            <AppText variant="heading" style={styles.shareTitle}>
              {sharing ? "Sharing your location" : "Not sharing"}
            </AppText>
            <AppText variant="muted">
              {sharing ? "Parents can see the bus live." : "Tap to start sharing for the trip."}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Card>
      </Pressable>

      {/* at-a-glance */}
      <View style={styles.statRow}>
        <StatCard
          label="Attendance"
          value={att && att.marked > 0 ? `${att.percent}%` : "—"}
          icon="checkbox-outline"
          tone="success"
        />
        <StatCard label="Students" value={route?.students ?? 0} icon="people-outline" tone="primary" />
      </View>

      {/* Route */}
      {route ? (
        <Card style={styles.block}>
          <View style={styles.routeHead}>
            <View style={styles.flex}>
              <AppText variant="heading">{route.name}</AppText>
              <AppText variant="muted">
                Route {route.code}
                {route.bus ? ` · Bus ${route.bus}` : ""}
              </AppText>
            </View>
            <View style={styles.routeBadge}>
              <AppText variant="small" style={styles.routeBadgeText}>
                {route.status || "active"}
              </AppText>
            </View>
          </View>
          <View style={styles.tripRow}>
            <Trip icon="time-outline" label="Departs" value={route.departure || "—"} />
            <Trip icon="flag-outline" label="Arrives" value={route.arrival || "—"} />
          </View>
          {route.stops.length ? (
            <View>
              <AppText variant="label">Stops ({route.stops.length})</AppText>
              <View style={styles.stops}>
                {route.stops.slice(0, 8).map((s, i) => (
                  <View key={`${s}-${i}`} style={styles.stopPill}>
                    <AppText variant="small" style={styles.stopText}>
                      {s}
                    </AppText>
                  </View>
                ))}
                {route.stops.length > 8 ? (
                  <View style={styles.stopPill}>
                    <AppText variant="small" style={styles.stopText}>
                      +{route.stops.length - 8} more
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </Card>
      ) : (
        <NoticeCard
          error={error}
          emptyText="No bus route is linked to your account yet. Ask the office to assign you a route."
          onRetry={load}
        />
      )}

      {/* quick actions */}
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

function Trip({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.trip}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <View>
        <AppText variant="small" style={styles.tripLabel}>
          {label}
        </AppText>
        <AppText style={styles.tripValue}>{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { gap: spacing.sm },

  holiday: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.warningSoft, borderColor: colors.warning },
  holidayIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  holidayTitle: { fontSize: 15, color: colors.warningText },

  share: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  shareOn: { backgroundColor: colors.successSoft, borderColor: colors.success },
  shareDot: { width: 14, height: 14, borderRadius: 7 },
  shareTitle: { fontSize: 15 },

  statRow: { flexDirection: "row", gap: spacing.md },

  routeHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  routeBadge: { backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  routeBadgeText: { color: colors.successText, fontWeight: fontWeight.semibold, textTransform: "capitalize" },

  tripRow: { flexDirection: "row", gap: spacing.md },
  trip: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  tripLabel: { color: colors.muted },
  tripValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },

  stops: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  stopPill: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  stopText: { color: colors.text },

  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  actionTile: {
    width: "47%",
    flexGrow: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actionLabel: { fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
});
