import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen, ScreenHeader, AppText, Card, Loading, Chips, PagedList, type ChipOption } from "@/components";
import {
  listAnnouncements,
  listNotices,
  listEvents,
  listHolidays,
  type Announcement,
  type Notice,
  type SchoolEvent,
  type Holiday,
} from "@/api/updates";
import { ApiError } from "@/api/client";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontWeight } from "@/theme";

type Tab = "announcements" | "notices" | "events" | "holidays";
const TABS: ChipOption[] = [
  { label: "Announcements", value: "announcements" },
  { label: "Notices", value: "notices" },
  { label: "Events", value: "events" },
  { label: "Holidays", value: "holidays" },
];

type AnyUpdate = Announcement | Notice | SchoolEvent | Holiday;

/** View-only "Updates" — teachers read these, writes are office-only. */
export default function Updates() {
  const [tab, setTab] = useState<Tab>("announcements");
  const [data, setData] = useState<AnyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows: AnyUpdate[] =
        tab === "announcements"
          ? await listAnnouncements()
          : tab === "notices"
            ? await listNotices()
            : tab === "events"
              ? await listEvents()
              : await listHolidays();
      setData(rows);
    } catch (e) {
      setData([]);
      // Events is a Standard+ module — a Starter plan 402s; show it gently.
      if (tab === "events" && e instanceof ApiError && e.status === 402)
        setError("Events aren't included in your school's plan.");
      else setError(e instanceof ApiError ? e.message : "Could not load updates.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

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
          data={
            tab === "announcements" || tab === "notices"
              ? [...(data as (Announcement | Notice)[])].sort((a, b) => Number(b.pinned) - Number(a.pinned))
              : data
          }
          resetKey={tab}
          keyExtractor={(it) => (it as { id: string }).id}
          emptyText="Nothing here yet."
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
            if (tab === "events") {
              const ev = item as SchoolEvent;
              return (
                <Card style={styles.gap4}>
                  <View style={styles.titleRow}>
                    <AppText variant="heading" style={styles.title}>
                      {ev.name}
                    </AppText>
                    {ev.status ? <Badge text={ev.status} /> : null}
                  </View>
                  {ev.date || ev.venue ? (
                    <AppText variant="muted">{[ev.date, ev.venue].filter(Boolean).join(" · ")}</AppText>
                  ) : null}
                </Card>
              );
            }
            const it = item as Announcement | Notice;
            return (
              <Card style={styles.gap4}>
                <AppText variant="heading" style={styles.title}>
                  {it.pinned ? "📌 " : ""}
                  {it.title}
                </AppText>
                {it.body ? <AppText variant="muted">{it.body}</AppText> : null}
                {it.date ? <AppText variant="small">{it.date}</AppText> : null}
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <AppText variant="small" style={styles.badgeText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: 15 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  dateChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateText: { color: colors.primaryText, fontWeight: fontWeight.bold },
  badge: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { color: colors.primaryText, fontWeight: fontWeight.semibold },
});
