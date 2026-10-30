import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Button } from "@/components";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

type LinkItem = { href: Href; icon: keyof typeof Ionicons.glyphMap; label: string; hint: string };

// Everything beyond the 5 tabs lives here, grouped for quick scanning.
const SECTIONS: { title: string; links: LinkItem[] }[] = [
  {
    title: "Academics",
    links: [
      { href: "/teacher/attendance", icon: "checkbox-outline", label: "Attendance", hint: "Daily roll-call for your class" },
      { href: "/teacher/marks", icon: "create-outline", label: "Enter marks", hint: "Exam marks for your classes" },
      { href: "/teacher/report-cards", icon: "ribbon-outline", label: "Report cards", hint: "Exam results & grades" },
      { href: "/teacher/teaching", icon: "library-outline", label: "Teaching", hint: "Material, classes & syllabus" },
    ],
  },
  {
    title: "School",
    links: [
      { href: "/teacher/notifications", icon: "notifications-outline", label: "Alerts", hint: "Your notifications" },
      { href: "/teacher/updates", icon: "megaphone-outline", label: "Updates", hint: "Announcements, notices, events" },
      { href: "/teacher/substitutions", icon: "swap-horizontal-outline", label: "Cover duties", hint: "Substitutions assigned to you" },
      { href: "/teacher/messages", icon: "chatbubbles-outline", label: "Message board", hint: "Shared with your school" },
      { href: "/teacher/timetable", icon: "calendar-outline", label: "Timetable", hint: "Your weekly periods" },
    ],
  },
  {
    title: "Me",
    links: [
      { href: "/teacher/leave", icon: "calendar-clear-outline", label: "My leave", hint: "Apply & track approvals" },
      { href: "/teacher/id-card", icon: "card-outline", label: "My ID card", hint: "Your staff ID" },
    ],
  },
];

export default function More() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const unread = useNotifications((s) => s.unread);
  const refresh = useNotifications((s) => s.refresh);
  const initial = (user?.name ?? "?").slice(0, 1).toUpperCase();

  // Keep the Alerts count fresh while this tab is open (Home isn't focused here).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <Screen style={{ gap: spacing.lg }}>
      <AppText variant="title">More</AppText>

      {/* Tap to edit your own profile (name, photo, password). */}
      <Pressable onPress={() => router.push("/teacher/profile")}>
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initial}</AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">{user?.name}</AppText>
            <AppText variant="muted">{user?.email}</AppText>
            <AppText variant="muted">Tap to edit your profile</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Card>
      </Pressable>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <AppText variant="label">{section.title}</AppText>
          {section.links.map((l) => (
            <Pressable key={l.label} onPress={() => router.push(l.href)}>
              <Card style={styles.row}>
                <View style={styles.icon}>
                  <Ionicons name={l.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.rowTitle}>
                    {l.label}
                  </AppText>
                  <AppText variant="muted">{l.hint}</AppText>
                </View>
                {l.href === "/teacher/notifications" && unread ? (
                  <View style={styles.badge}>
                    <AppText style={styles.badgeText}>{unread > 9 ? "9+" : unread}</AppText>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Card>
            </Pressable>
          ))}
        </View>
      ))}

      <Button title="Sign out" variant="outline" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryText, fontSize: 20, fontWeight: fontWeight.bold },
  section: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});
