import { Redirect, useRouter } from "expo-router";
import { Screen, AppText, Button, Loading } from "@/components";
import { useAuth } from "@/store/auth";
import { spacing } from "@/theme";

/** Entry gate: wait for hydration, then route by auth + role. */
export default function Index() {
  const router = useRouter();
  const { status, user, signOut } = useAuth();

  if (status === "loading") {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  if (status === "guest" || !user) return <Redirect href="/login" />;
  if (user.role === "teacher") return <Redirect href="/teacher" />;
  if (user.role === "driver") return <Redirect href="/driver" />;

  // Teacher + driver apps are in; other roles land here until their section ships.
  return (
    <Screen scroll={false} style={{ justifyContent: "center", gap: spacing.lg }}>
      <AppText variant="title">Coming soon</AppText>
      <AppText variant="muted">
        The full {user.role} experience isn&apos;t in the app yet — more is on the way. Meanwhile, you
        can track the school bus live.
      </AppText>
      <Button title="Track the school bus" onPress={() => router.push("/track")} />
      <Button title="Sign out" variant="outline" onPress={() => signOut()} />
    </Screen>
  );
}
