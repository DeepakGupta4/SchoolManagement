import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Button } from "@/components";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing, fontWeight } from "@/theme";

export default function DriverMore() {
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

      <Pressable onPress={() => router.push("/driver/assistant")} accessibilityLabel="AI assistant">
        <Card style={styles.row}>
          <View style={styles.icon}>
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading" style={styles.rowTitle}>
              AI assistant
            </AppText>
            <AppText variant="muted">Ask about anything in the app</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Card>
      </Pressable>

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
