import { StyleSheet, View } from "react-native";
import { Screen } from "./Screen";
import { ScreenHeader } from "./ScreenHeader";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import { useAuth } from "@/store/auth";
import { spacing } from "@/theme";

/** Shared "More" screen for the simpler role sections: identity + sign out. */
export function AccountScreen() {
  const { user, signOut } = useAuth();

  return (
    <Screen style={{ gap: spacing.lg }}>
      <ScreenHeader title="More" />
      <Card style={styles.profile}>
        <Avatar name={user?.name} uri={user?.avatar} size={52} />
        <View style={styles.flex}>
          <AppText variant="heading">{user?.name}</AppText>
          <AppText variant="muted">{user?.email}</AppText>
          <AppText variant="muted">Role: {user?.role}</AppText>
        </View>
      </Card>
      <Button title="Sign out" variant="outline" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
