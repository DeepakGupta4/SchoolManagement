import { StyleSheet, View } from "react-native";
import { Screen, AppText, Card, Button } from "@/components";
import { useAuth } from "@/store/auth";
import { colors, spacing, fontWeight } from "@/theme";

export default function DriverMore() {
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
});
