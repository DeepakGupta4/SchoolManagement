import { Pressable, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Button, Avatar } from "@/components";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme";

type LinkItem = { href: Href; icon: keyof typeof Ionicons.glyphMap; label: string; hint: string };

const LINKS: LinkItem[] = [
  { href: "/accountant/payments", icon: "receipt-outline", label: "Payments", hint: "The payment register" },
  { href: "/accountant/dues", icon: "alert-circle-outline", label: "Fee dues", hint: "Students with outstanding fees" },
  { href: "/accountant/report-cards", icon: "ribbon-outline", label: "Report cards", hint: "View & print report cards" },
  { href: "/accountant/admit-cards", icon: "reader-outline", label: "Admit cards", hint: "View & print admit cards" },
  { href: "/accountant/timetable", icon: "calendar-outline", label: "Timetable", hint: "The class timetable" },
  { href: "/accountant/leave", icon: "calendar-clear-outline", label: "My leave", hint: "Apply & track approvals" },
  { href: "/accountant/messages", icon: "chatbubbles-outline", label: "Message board", hint: "Shared with your school" },
  { href: "/accountant/id-card", icon: "card-outline", label: "My ID card", hint: "Your staff ID" },
  { href: "/accountant/assistant", icon: "sparkles-outline", label: "AI assistant", hint: "Ask about anything in the app" },
];

export default function AccountantMore() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <Screen style={{ gap: spacing.lg }}>
      <AppText variant="title">More</AppText>

      <Pressable onPress={() => router.push("/accountant/profile")} accessibilityLabel="Edit your profile">
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
