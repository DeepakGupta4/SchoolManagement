import { Screen, AppText, Card, Button } from "@/components";
import { useAuth } from "@/store/auth";
import { spacing } from "@/theme";

export default function More() {
  const { user, signOut } = useAuth();
  return (
    <Screen style={{ gap: spacing.lg }}>
      <AppText variant="title">More</AppText>
      <Card>
        <AppText variant="heading">{user?.name}</AppText>
        <AppText variant="muted">{user?.email}</AppText>
        <AppText variant="muted">Role: {user?.role}</AppText>
      </Card>
      <Button title="Sign out" variant="outline" onPress={() => signOut()} />
    </Screen>
  );
}
