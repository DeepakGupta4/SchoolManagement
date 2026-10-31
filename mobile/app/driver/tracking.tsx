import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Button, Loading } from "@/components";
import { getMyRoute, setTracking, type DriverRoute } from "@/api/transport";
import { startTracking, stopTracking, isTracking } from "@/lib/tracking";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight } from "@/theme";

/** Driver live-tracking: their route + a big Start/Stop location-sharing toggle. */
export default function DriverTracking() {
  const router = useRouter();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [on, setOn] = useState(false);
  const [mode, setMode] = useState<"background" | "foreground" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getMyRoute();
      setRoute(r);
      setOn(await isTracking());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your route.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await startTracking();
      setMode(m);
      await setTracking(true).catch(() => {});
      setOn(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start sharing.");
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    setError(null);
    try {
      await stopTracking();
      await setTracking(false).catch(() => {});
      setOn(false);
      setMode(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your route…" />
      </Screen>
    );
  }

  if (!route) {
    return (
      <Screen style={{ gap: spacing.md }}>
        <AppText variant="title">Live tracking</AppText>
        <Card>
          <AppText variant="muted">
            No bus route is linked to your account yet. Ask the office to assign you a route, then come
            back here.
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }}>
      <AppText variant="title">Live tracking</AppText>

      <Card style={styles.gap4}>
        <AppText variant="heading">{route.name}</AppText>
        <AppText variant="muted">
          Route {route.code}
          {route.bus ? ` · Bus ${route.bus}` : ""}
        </AppText>
        <AppText variant="muted">
          {route.departure || "—"} → {route.arrival || "—"} · {route.students} students
        </AppText>
        {route.stops.length ? <AppText variant="small">{route.stops.length} stops</AppText> : null}
      </Card>

      <Card style={[styles.status, on && styles.statusOn]}>
        <View style={[styles.dot, { backgroundColor: on ? colors.success : colors.subtle }]} />
        <View style={styles.flex}>
          <AppText variant="heading" style={styles.statusTitle}>
            {on ? "Sharing your location" : "Not sharing"}
          </AppText>
          <AppText variant="muted">
            {on
              ? mode === "foreground"
                ? "Keep this app open — your phone is sharing the bus location."
                : "The bus is live for parents, even if you lock your phone."
              : "Turn this on so parents can track the bus live."}
          </AppText>
        </View>
      </Card>

      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}

      {on ? (
        <Button title={busy ? "Stopping…" : "Stop sharing"} variant="outline" onPress={stop} loading={busy} />
      ) : (
        <Button title={busy ? "Starting…" : "Start sharing location"} onPress={start} loading={busy} />
      )}

      <Button
        title="Open live map"
        variant="ghost"
        onPress={() => router.push("/track")}
      />

      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
        <AppText variant="small" style={styles.tipText}>
          Start sharing when you begin the trip and stop when it ends. Parents of your route&apos;s students
          see the bus move on the map in real time.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  status: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  statusOn: { backgroundColor: colors.successSoft, borderColor: colors.success },
  dot: { width: 14, height: 14, borderRadius: 7 },
  statusTitle: { fontSize: 15 },
  tip: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingHorizontal: spacing.xs },
  tipText: { flex: 1, color: colors.muted },
});
