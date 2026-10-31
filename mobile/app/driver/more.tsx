import { Pressable, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Button, Avatar } from "@/components";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing, fontWeight } from "@/theme";

type LinkItem = { href: Href; icon: keyof typeof Ionicons.glyphMap; label: string; hint: string };

const LINKS: LinkItem[] = [
  { href: "/driver/tracking", icon: "navigate-outline", label: "Live tracking", hint: "Share the bus location" },
  { href: "/track", icon: "map-outline", label: "Live map", hint: "See buses on the map" },
  { href: "/driver/students", icon: "people-outline", label: "My students", hint: "Who rides your route" },
  { href: "/driver/attendance", icon: "checkbox-outline", label: "My attendance", hint: "Your daily attendance" },
  { href: "/driver/leave", icon: "calendar-clear-outline", label: "My leave", hint: "Apply & track approvals" },
  { href: "/driver/updates", icon: "megaphone-outline", label: "Updates", hint: "Announcements, notices, holidays" },
  { href: "/driver/messages", icon: "chatbubbles-outline", label: "Message board", hint: "Shared with your school" },
  { href: "/driver/id-card", icon: "card-outline", label: "My ID card", hint: "Your staff ID" },
  { href: "/driver/assistant", icon: "sparkles-outline", label: "AI assistant", hint: "Ask about anything in the app" },
];

export default function DriverMore() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <Screen style={{ gap: spacing.lg }}>
      <AppText variant="title">More</AppText>

      <Pressable onPress={() => router.push("/driver/profile")} accessibilityLabel="Edit your profile">
        <Card style={styles.profile}>
          <Avatar name={user?.name} uri={user?.avatar} size={52} />
          <View style={styles.flex}>
            <AppText variant="heading">{user?.name}</AppText>
            <AppText variant="muted">{user?.email}</AppText>
            <AppText variant="muted">Tap to edit your profile</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Card>
      </Pressable>

      <View style={styles.section}>
        {LINKS.map((l) => (
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
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Card>
          </Pressable>
        ))}
      </View>

      <Button title="Sign out" variant="outline" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.md },
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
});
