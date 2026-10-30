import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, StatCard, Loading } from "@/components";
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
import { colors, radius, spacing, fontWeight, fontSize, gradients, shadow } from "@/theme";

type QuickAction = { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; bg: string; fg: string };

// Soft-bg + dark-glyph pairs (all from theme) — same system as the chips/StatCard.
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
      // Scope the timetable to this teacher server-side (name is the only join key).
      const nm = teacherName(t);
      setTimetable(nm ? await getTimetable(nm).catch(() => []) : []);
    } catch {
      /* keep whatever we already have */
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh dashboard + alert badge every time Home comes into focus.
  useFocusEffect(
    useCallback(() => {
      load();
      refreshAlerts();
    }, [load, refreshAlerts])
  );

  const name = teacherName(teacher) || user?.name || "Teacher";
  const initial = (name.trim()[0] || "T").toUpperCase();
  const avatarUri = teacher?.avatar ?? user?.avatar;
  const classes = teacher?.classes ?? [];
  const subjects = teacher?.subjects ?? [];
  const classTeacherOf =
    teacher?.isClassTeacher && teacher.classTeacherOf
      ? `${teacher.classTeacherOf}${teacher.classTeacherSection ? ` · ${teacher.classTeacherSection}` : ""}`
      : null;

  const today = useMemo(() => new Date().toLocaleDateString("en-US", { weekday: "long" }), []);
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }),
    []
  );
  // Match only off the authoritative teacher record; null = record not loaded (≠ a free day).
  const myName = teacher ? normName(teacherName(teacher)) : null;
  const todays = useMemo(() => {
    if (!myName) return null;
    return timetable
      .filter((e) => normName(e.day) === normName(today) && isTaughtBy(e, myName))
      .sort((a, b) => a.period - b.period);
  }, [timetable, today, myName]);

  if (loading && !teacher) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your dashboard…" />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* header: identity + alerts bell */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <AppText style={styles.avatarText}>{initial}</AppText>
            </View>
          )}
          <View style={styles.flex}>
            <AppText variant="muted">Welcome back 👋</AppText>
            <AppText variant="heading" style={styles.name} numberOfLines={1}>
              {name}
            </AppText>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/teacher/notifications")}
          style={styles.bell}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={unread ? `Alerts, ${unread} unread` : "Alerts"}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unread ? (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{unread > 9 ? "9+" : unread}</AppText>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* class teacher's #1 daily task */}
      {classTeacherOf ? (
        <Pressable onPress={() => router.push("/teacher/attendance")} accessibilityRole="button">
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <View style={styles.ctaIcon}>
              <Ionicons name="checkbox-outline" size={22} color={colors.onPrimary} />
            </View>
            <View style={styles.flex}>
              <AppText style={styles.ctaTitle}>Take today&apos;s attendance</AppText>
              <AppText style={styles.ctaSub}>Class {classTeacherOf}</AppText>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
          </LinearGradient>
        </Pressable>
      ) : null}

      {/* at-a-glance */}
      <View style={styles.statRow}>
        <StatCard label="My classes" value={classes.length} icon="school-outline" tone="primary" />
        <StatCard label="My subjects" value={subjects.length} icon="book-outline" tone="info" />
      </View>

      {/* quick actions */}
      <View style={styles.block}>
        <AppText variant="label">Quick actions</AppText>
        <View style={styles.actions}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={styles.action}
              onPress={() => router.push(a.href)}
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={22} color={a.fg} />
              </View>
              <AppText variant="small" style={styles.actionLabel}>
                {a.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* today's periods (from the timetable) */}
      <Card style={styles.block}>
        <View style={styles.cardHead}>
          <AppText variant="heading">Today&apos;s classes</AppText>
          <AppText variant="muted">{todayLabel}</AppText>
        </View>
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
    </Screen>
  );
}

function ChipRow({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <AppText variant="muted">{empty}</AppText>;
  return (
    <View style={styles.chips}>
      {items.map((c) => (
        <View key={c} style={styles.chip}>
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

  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primaryText, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  name: { fontSize: fontSize.xl },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.onPrimary, fontSize: 10, fontWeight: fontWeight.bold },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.onPrimarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: { color: colors.onPrimary, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  ctaSub: { color: colors.onPrimary, fontSize: fontSize.sm },

  statRow: { flexDirection: "row", gap: spacing.md },

  block: { gap: spacing.sm },

  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1, alignItems: "center", gap: spacing.xs },
  actionIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  actionLabel: { color: colors.text, textAlign: "center", fontSize: fontSize.sm },

  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
