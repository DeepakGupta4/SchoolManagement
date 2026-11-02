import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "./Screen";
import { ScreenHeader } from "./ScreenHeader";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { Loading } from "./Loading";
import { Button } from "./Button";
import { PagedList } from "./PagedList";
import { useNotifications } from "@/store/notifications";
import { markRead, markAllRead } from "@/api/notifications";
import { timeAgo } from "@/lib/time";
import { colors, spacing } from "@/theme";

/** Shared alerts/notifications inbox — per-user, so every role mounts the same screen. */
export function NotificationsScreen() {
  const { items, unread, refresh, markReadLocal, markAllReadLocal } = useNotifications();
  // Gate the full-screen loader on THIS screen's own first fetch — never the shared
  // store `loading` flag, which other screens (the home focus-refresh) also drive, or
  // the spinner can get stuck until a manual pull. Pull-to-refresh uses its own flag.
  const [firstLoad, setFirstLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;
    refresh().finally(() => {
      if (alive) setFirstLoad(false);
    });
    return () => {
      alive = false;
    };
  }, [refresh]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // Update the badge/dot IN PLACE — never re-fetch on a tap, or the whole list
  // visibly reloads. The server call just persists it in the background.
  const onRead = async (id: string, read: boolean) => {
    if (read) return;
    markReadLocal(id);
    try {
      await markRead(id);
    } catch {
      /* 404 = already gone — ignore */
    }
  };

  const onReadAll = async () => {
    markAllReadLocal();
    try {
      await markAllRead();
    } catch {
      /* ignore */
    }
  };

  if (firstLoad && items.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading notifications…" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <View style={styles.header}>
        <ScreenHeader title="Notifications" back />
        {unread > 0 ? <Button title="Mark all read" variant="ghost" onPress={onReadAll} /> : null}
      </View>

      <PagedList
        data={items}
        keyExtractor={(n) => n.id}
        pageSize={15}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={{ gap: spacing.sm }}
        emptyText="You're all caught up. 🎉"
        renderItem={({ item }) => (
          <Pressable onPress={() => onRead(item.id, item.read)}>
            <Card style={[styles.card, !item.read && styles.unread]}>
              <View style={styles.row}>
                <View style={!item.read ? styles.dot : styles.dotSpace} />
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.cardTitle}>
                    {item.title}
                  </AppText>
                  {item.body ? <AppText variant="muted">{item.body}</AppText> : null}
                  <AppText variant="small">{timeAgo(item.createdAt)}</AppText>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  card: { padding: spacing.md },
  unread: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  flex: { flex: 1 },
  cardTitle: { fontSize: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  dotSpace: { width: 8 },
});
