import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Loading, Chips, TextField, PagedList, type ChipOption } from "@/components";
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
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

type Tab = "announcements" | "notices" | "events" | "holidays";
const TABS: ChipOption[] = [
  { label: "Announcements", value: "announcements" },
  { label: "Notices", value: "notices" },
  { label: "Events", value: "events" },
  { label: "Holidays", value: "holidays" },
];

type AnyUpdate = Announcement | Notice | SchoolEvent | Holiday;

/** View-only "Updates" — teachers read these; writes are office-only. */
export default function Updates() {
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

  useEffect(() => {
    setSearch("");
  }, [tab]);

  const q = search.trim().toLowerCase();
  const rows = useMemo<AnyUpdate[]>(() => {
    const match = (fields: (string | undefined)[]) => !q || fields.some((f) => (f ?? "").toLowerCase().includes(q));
    if (tab === "announcements" || tab === "notices") {
      return [...(data as (Announcement | Notice)[])]
        .filter((it) => match([it.title, it.body, it.category]))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }
    if (tab === "events") {
      return (data as SchoolEvent[]).filter((ev) => match([ev.name, ev.venue, ev.category, ev.status]));
    }
    return (data as Holiday[]).filter((h) => match([h.name, h.type]));
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
            if (tab === "events") {
              const ev = item as SchoolEvent;
              return (
                <Card style={styles.gap6}>
                  <View style={styles.titleRow}>
                    <AppText variant="heading" style={styles.title}>
                      {ev.name}
                    </AppText>
                    {ev.status ? <Badge text={ev.status} tone={eventTone(ev.status)} /> : null}
                  </View>
                  {ev.date || ev.venue ? (
                    <View style={styles.metaRow}>
                      {ev.date ? <Meta icon="calendar-outline" text={ev.date} /> : null}
                      {ev.venue ? <Meta icon="location-outline" text={ev.venue} /> : null}
                    </View>
                  ) : null}
                  {ev.category ? <Badge text={ev.category} tone="soft" /> : null}
                </Card>
              );
            }
            const it = item as Announcement | Notice;
            const priority = (it as Notice).priority;
            return (
              <Card style={styles.gap6}>
                <View style={styles.titleRow}>
                  <AppText variant="heading" style={styles.title}>
                    {it.pinned ? "📌 " : ""}
                    {it.title}
                  </AppText>
                  {priority && priority.toLowerCase() !== "normal" ? (
                    <Badge text={priority} tone={priorityTone(priority)} />
                  ) : null}
                </View>
                {it.body ? (
                  <AppText variant="muted" numberOfLines={4}>
                    {it.body}
                  </AppText>
                ) : null}
                <View style={styles.metaRow}>
                  {it.category ? <Badge text={it.category} tone="soft" /> : null}
                  {it.date ? <Meta icon="time-outline" text={it.date} /> : null}
                </View>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

type Tone = "soft" | "success" | "warning" | "danger";

function eventTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("done")) return "success";
  if (s.includes("cancel")) return "danger";
  if (s.includes("ongoing") || s.includes("live")) return "warning";
  return "soft";
}

function priorityTone(priority: string): Tone {
  const p = priority.toLowerCase();
  if (p.includes("high") || p.includes("urgent")) return "danger";
  if (p.includes("medium")) return "warning";
  return "soft";
}

function Badge({ text, tone = "soft" }: { text: string; tone?: Tone }) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <AppText variant="small" style={[styles.badgeText, styles[`badgeText_${tone}`]]}>
        {text}
      </AppText>
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={colors.muted} />
      <AppText variant="small" style={styles.metaText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap6: { gap: 6 },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: 15, flexShrink: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { color: colors.muted },

  dateChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateText: { color: colors.primaryText, fontWeight: fontWeight.bold },

  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: "flex-start" },
  badgeText: { fontWeight: fontWeight.semibold, textTransform: "capitalize", fontSize: fontSize.xs },
  badge_soft: { backgroundColor: colors.surfaceAlt },
  badgeText_soft: { color: colors.muted },
  badge_success: { backgroundColor: colors.successSoft },
  badgeText_success: { color: colors.successText },
  badge_warning: { backgroundColor: colors.warningSoft },
  badgeText_warning: { color: colors.warningText },
  badge_danger: { backgroundColor: colors.dangerSoft },
  badgeText_danger: { color: colors.dangerText },
});
