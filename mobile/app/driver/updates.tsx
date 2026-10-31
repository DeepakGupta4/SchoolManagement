import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Loading, Chips, TextField, PagedList, type ChipOption } from "@/components";
import { listAnnouncements, listNotices, listHolidays, type Announcement, type Notice, type Holiday } from "@/api/updates";
import { ApiError } from "@/api/client";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

type Tab = "announcements" | "notices" | "holidays";
const TABS: ChipOption[] = [
  { label: "Announcements", value: "announcements" },
  { label: "Notices", value: "notices" },
  { label: "Holidays", value: "holidays" },
];

type AnyUpdate = Announcement | Notice | Holiday;

/** Read-only school updates for the driver (announcements, notices, holidays). */
export default function DriverUpdates() {
  const [tab, setTab] = useState<Tab>("announcements");
  const [data, setData] = useState<AnyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows: AnyUpdate[] =
        tab === "announcements" ? await listAnnouncements() : tab === "notices" ? await listNotices() : await listHolidays();
      setData(rows);
    } catch (e) {
      setData([]);
      setError(e instanceof ApiError ? e.message : "Could not load updates.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSearch("");
  }, [tab]);

  const q = search.trim().toLowerCase();
  const rows = useMemo<AnyUpdate[]>(() => {
    const match = (fields: (string | undefined)[]) => !q || fields.some((f) => (f ?? "").toLowerCase().includes(q));
    if (tab === "holidays") return (data as Holiday[]).filter((h) => match([h.name, h.type]));
    return [...(data as (Announcement | Notice)[])]
      .filter((it) => match([it.title, it.body, it.category]))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [tab, data, q]);

  const header =
    data.length > 0 ? (
      <View style={styles.header}>
        <AppText variant="muted">
          {data.length} item{data.length === 1 ? "" : "s"}
        </AppText>
        <TextField label="" value={search} onChangeText={setSearch} placeholder="Search…" autoCapitalize="none" />
      </View>
    ) : null;

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="Updates" back />
      <Chips options={TABS} value={tab} onChange={(v) => setTab(v as Tab)} />

      {loading ? (
        <Loading label="Loading…" />
      ) : error ? (
        <Card>
          <AppText variant="muted">{error}</AppText>
        </Card>
      ) : (
        <PagedList
          data={rows}
          resetKey={`${tab}|${q}`}
          keyExtractor={(it) => (it as { id: string }).id}
          ListHeaderComponent={header}
          emptyText={q ? "No matches." : "Nothing here yet."}
          renderItem={({ item }) => {
            if (tab === "holidays") {
              const h = item as Holiday;
              return (
                <Card style={styles.row}>
                  <View style={styles.dateChip}>
                    <AppText variant="small" style={styles.dateText}>
                      {prettyDate(h.date)}
                    </AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="heading" style={styles.title}>
                      {h.name}
                    </AppText>
                    {h.type ? <AppText variant="muted">{h.type}</AppText> : null}
                  </View>
                </Card>
              );
            }
            const it = item as Announcement | Notice;
            return (
              <Card style={styles.gap6}>
                <AppText variant="heading" style={styles.title}>
                  {it.pinned ? "📌 " : ""}
                  {it.title}
                </AppText>
                {it.body ? (
                  <AppText variant="muted" numberOfLines={5}>
                    {it.body}
                  </AppText>
                ) : null}
                <View style={styles.metaRow}>
                  {it.category ? (
                    <View style={styles.cat}>
                      <AppText variant="small" style={styles.catText}>
                        {it.category}
                      </AppText>
                    </View>
                  ) : null}
                  {it.date ? (
                    <View style={styles.meta}>
                      <Ionicons name="time-outline" size={13} color={colors.muted} />
                      <AppText variant="small" style={styles.metaText}>
                        {it.date}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap6: { gap: 6 },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: 15, flexShrink: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { color: colors.muted },
  cat: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  catText: { color: colors.muted, fontWeight: fontWeight.semibold, textTransform: "capitalize", fontSize: fontSize.xs },
  dateChip: { backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  dateText: { color: colors.primaryText, fontWeight: fontWeight.bold },
});
