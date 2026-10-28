import { Pressable, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Button } from "@/components";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing, fontWeight } from "@/theme";

// Secondary destinations that don't deserve their own tab. Grows over time
// (My Profile, My ID Card, Leave…).
const LINKS: { href: Href; icon: keyof typeof Ionicons.glyphMap; label: string; hint: string }[] = [
  { href: "/teacher/timetable", icon: "calendar-outline", label: "Timetable", hint: "Your weekly periods" },
];

export default function More() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const initial = (user?.name ?? "?").slice(0, 1).toUpperCase();

  return (
    <Screen style={{ gap: spacing.lg }}>
      <AppText variant="title">More</AppText>

      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{initial}</AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">{user?.name}</AppText>
          <AppText variant="muted">{user?.email}</AppText>
          <AppText variant="small">Role: {user?.role}</AppText>
        </View>
      </Card>

      <View style={styles.links}>
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
              <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
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
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryText, fontSize: 20, fontWeight: fontWeight.bold },
  links: { gap: spacing.sm },
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
