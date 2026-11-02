import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, Loading, TimetableGrid } from "@/components";
import { getTimetable, type TimetableEntry } from "@/api/teacher";
import { ApiError } from "@/api/client";
import { spacing } from "@/theme";

/** A child's class timetable (parent view) — the same grid as everywhere else. */
export default function ParentTimetable() {
  const { class: klass, section, name } = useLocalSearchParams<{ class?: string; section?: string; name?: string }>();
  const className = typeof klass === "string" ? klass : "";
  const sec = typeof section === "string" ? section : "";
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEntries(await getTimetable());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the timetable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && entries.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading timetable…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }} onRefresh={load}>
      <View>
        <ScreenHeader title="Timetable" back />
        <AppText variant="muted">
          {typeof name === "string" ? `${name} · ` : ""}
          {className}
          {sec ? ` · ${sec}` : ""}
        </AppText>
      </View>

      {error ? (
        <Card>
          <AppText variant="muted">{error}</AppText>
        </Card>
      ) : (
        <TimetableGrid entries={entries} className={className} section={sec} />
      )}
    </Screen>
  );
}
