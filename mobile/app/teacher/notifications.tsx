import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen, ScreenHeader, AppText, Card, Loading, Button, PagedList } from "@/components";
import { useNotifications } from "@/store/notifications";
import { markRead, markAllRead } from "@/api/notifications";
import { timeAgo } from "@/lib/time";
import { colors, spacing } from "@/theme";

export default function Notifications() {
  const { items, unread, loading, refresh } = useNotifications();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onRead = async (id: string, read: boolean) => {
    if (read) return;
    try {
      await markRead(id);
      refresh();
    } catch {
      /* 404 = already gone — ignore */
    }
  };

  const onReadAll = async () => {
    try {
      await markAllRead();
      refresh();
    } catch {
      /* ignore */
    }
  };

  if (loading && items.length === 0) {
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
        onRefresh={refresh}
        refreshing={loading}
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
