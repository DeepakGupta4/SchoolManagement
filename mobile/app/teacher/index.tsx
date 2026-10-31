import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText, Card, StatCard, DashboardScreen, HeroAction } from "@/components";
import {
  getMyTeacher,
  getTimetable,
  teacherName,
  normName,
  isTaughtBy,
  type Teacher,
  type TimetableEntry,
} from "@/api/teacher";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

type QuickAction = { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; bg: string; fg: string };

// Soft-bg + dark-glyph pairs (all from theme) — each action owns one hue.
const ACTIONS: QuickAction[] = [
  { label: "Attendance", icon: "checkbox-outline", href: "/teacher/attendance", bg: colors.primarySoft, fg: colors.primaryText },
  { label: "Homework", icon: "document-text-outline", href: "/teacher/homework", bg: colors.infoSoft, fg: colors.infoText },
  { label: "Marks", icon: "create-outline", href: "/teacher/marks", bg: colors.successSoft, fg: colors.successText },
  { label: "Reports", icon: "ribbon-outline", href: "/teacher/report-cards", bg: colors.warningSoft, fg: colors.warningText },
];

export default function TeacherHome() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const unread = useNotifications((s) => s.unread);
  const refreshAlerts = useNotifications((s) => s.refresh);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const t = await getMyTeacher();
      setTeacher(t);
      // Mirror the admin-uploaded teacher photo onto the signed-in user so More /
      // My Profile (which read user.avatar) show it too — not just the dashboard.
      const auth = useAuth.getState();
      if (t.avatar && auth.user && !auth.user.avatar) auth.setUser({ ...auth.user, avatar: t.avatar });
      // Scope the timetable to this teacher server-side (name is the only join key).
      const nm = teacherName(t);
      setTimetable(nm ? await getTimetable(nm).catch(() => []) : []);
    } catch {
      /* keep whatever we already have */
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

  const name = teacherName(teacher) || user?.name || "Teacher";
  const avatarUri = user?.avatar || teacher?.avatar;
  const meta = teacher?.department || undefined;
  const classes = teacher?.classes ?? [];
  const subjects = teacher?.subjects ?? [];
  const classTeacherOf =
    teacher?.isClassTeacher && teacher.classTeacherOf
      ? `${teacher.classTeacherOf}${teacher.classTeacherSection ? ` · ${teacher.classTeacherSection}` : ""}`
      : null;

  const today = useMemo(() => new Date().toLocaleDateString("en-US", { weekday: "long" }), []);
  // Match only off the authoritative teacher record; null = record not loaded (≠ a free day).
  const myName = teacher ? normName(teacherName(teacher)) : null;
  const todays = useMemo(() => {
    if (!myName) return null;
    return timetable
      .filter((e) => normName(e.day) === normName(today) && isTaughtBy(e, myName))
      .sort((a, b) => a.period - b.period);
  }, [timetable, today, myName]);

  const bell = (
    <HeroAction
      icon="notifications-outline"
      badge={unread ? (unread > 9 ? "9+" : unread) : undefined}
      onPress={() => router.push("/teacher/notifications")}
      accessibilityLabel={unread ? `Alerts, ${unread} unread` : "Alerts"}
    />
  );

  return (
    <DashboardScreen name={name} avatarUri={avatarUri} meta={meta} rightSlot={bell} loading={loading && !teacher}>
      {/* class teacher's #1 daily task */}
      {classTeacherOf ? (
        <Pressable onPress={() => router.push("/teacher/attendance")} accessibilityRole="button">
          <Card style={styles.cta}>
            <View style={styles.ctaIcon}>
              <Ionicons name="checkbox-outline" size={22} color={colors.onPrimary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" style={styles.ctaTitle}>
                Take today&apos;s attendance
              </AppText>
              <AppText variant="muted">Class {classTeacherOf}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </Card>
        </Pressable>
      ) : null}

      {/* at-a-glance */}
      <View style={styles.statRow}>
        <StatCard label="My classes" value={classes.length} icon="school-outline" tone="primary" />
        <StatCard label="My subjects" value={subjects.length} icon="book-outline" tone="info" />
      </View>

      {/* quick actions — colourful 2×2 tiles */}
      <Card style={styles.block}>
        <AppText variant="heading">Quick actions</AppText>
        <View style={styles.actionGrid}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={[styles.actionTile, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.href)}
              accessibilityRole="button"
            >
              <View style={styles.actionTileIcon}>
                <Ionicons name={a.icon} size={20} color={a.fg} />
              </View>
              <AppText style={[styles.actionTileLabel, { color: a.fg }]} numberOfLines={1}>
                {a.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* today's periods (from the timetable) */}
      <Card style={styles.block}>
        <Pressable style={styles.cardHead} onPress={() => router.push("/teacher/timetable")} accessibilityRole="button">
          <AppText variant="heading">Today&apos;s classes</AppText>
          <View style={styles.cardHeadRight}>
            <AppText variant="muted">{today}</AppText>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
        </Pressable>
        {todays === null ? (
          <EmptyState icon="cloud-offline-outline" text="Couldn't load your timetable just now." />
        ) : todays.length ? (
          todays.map((e) => (
            <View key={e.id} style={styles.period}>
              <View style={styles.periodNo}>
                <AppText style={styles.periodNoText}>P{e.period}</AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="heading" style={styles.periodSubject}>
                  {e.subject}
                </AppText>
                <AppText variant="muted">
                  {e.className}
                  {e.section ? ` · ${e.section}` : ""}
                  {e.room ? ` · Room ${e.room}` : ""}
                </AppText>
              </View>
            </View>
          ))
        ) : (
          <EmptyState icon="cafe-outline" text={`No periods scheduled for ${today}.`} />
        )}
      </Card>

      {/* classes + subjects */}
      <Card style={styles.block}>
        <AppText variant="heading">Your teaching</AppText>

        <AppText variant="label" style={styles.subLabel}>
          Classes
        </AppText>
        <ChipRow items={classes} empty="No classes assigned yet." />

        <AppText variant="label" style={styles.subLabel}>
          Subjects
        </AppText>
        <ChipRow items={subjects} empty="No subjects assigned yet." />
      </Card>
    </DashboardScreen>
  );
}

function ChipRow({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <AppText variant="muted">{empty}</AppText>;
  return (
    <View style={styles.chips}>
      {items.map((c, i) => (
        <View key={`${c}-${i}`} style={styles.chip}>
          <AppText variant="small" style={styles.chipText}>
            {c}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={22} color={colors.primaryText} />
      </View>
      <AppText variant="muted" style={styles.emptyText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { gap: spacing.sm },

  // attendance CTA (light-indigo actionable card)
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: { fontSize: fontSize.md, color: colors.primaryText },

  statRow: { flexDirection: "row", gap: spacing.md },

  // quick actions
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  actionTile: {
    flexGrow: 1,
    flexBasis: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  actionTileIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTileLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardHeadRight: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  period: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  periodNo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  periodNoText: { color: colors.primaryText, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  periodSubject: { fontSize: fontSize.md },

  emptyState: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { textAlign: "center" },

  subLabel: { marginTop: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: { color: colors.primaryText, fontWeight: fontWeight.medium },
});
