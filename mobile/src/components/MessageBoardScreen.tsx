import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "./Screen";
import { ScreenHeader } from "./ScreenHeader";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { Loading } from "./Loading";
import { PagedList } from "./PagedList";
import { listMessages, createMessage, type Message } from "@/api/messages";
import { useAuth } from "@/store/auth";
import { ApiError } from "@/api/client";
import { colors, spacing } from "@/theme";

/**
 * School message BOARD — shared with everyone (no private threads on the backend).
 * Role-agnostic: the poster's name comes from the signed-in user, their role
 * label from `posterRole`.
 */
export function MessageBoardScreen({ posterRole }: { posterRole: string }) {
  const user = useAuth((s) => s.user);
  const [rows, setRows] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listMessages());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the board.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onPost = async () => {
    if (!subject.trim() && !body.trim()) {
      setError("Write a subject or a message first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const msg = await createMessage({
        name: user?.name || posterRole,
        role: posterRole,
        subject: subject.trim(),
        body: body.trim(),
        category: "Direct",
      });
      setRows((p) => [msg, ...p]);
      setSubject("");
      setBody("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not post your message.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && rows.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <View>
        <ScreenHeader title="Message Board" back />
        <AppText variant="muted">Posts are shared with your whole school.</AppText>
      </View>

      <PagedList
        data={rows}
        keyExtractor={(m) => m.id}
        refreshing={loading}
        onRefresh={load}
        emptyText="No posts yet — be the first to share something."
        ListHeaderComponent={
          <Card style={{ gap: spacing.sm }}>
            <TextField label="Subject" value={subject} onChangeText={setSubject} />
            <TextField label="Message" value={body} onChangeText={setBody} multiline style={styles.body} />
            {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}
            <Button title="Post to board" onPress={onPost} loading={saving} />
          </Card>
        }
        renderItem={({ item: m }) => (
          <Card style={styles.gap2}>
            <AppText variant="small">
              {m.name || "Someone"}
              {m.role ? ` · ${m.role}` : ""}
              {m.time ? ` · ${m.time}` : ""}
            </AppText>
            {m.subject ? (
              <AppText variant="heading" style={styles.subject}>
                {m.subject}
              </AppText>
            ) : null}
            {m.body ? <AppText variant="muted">{m.body}</AppText> : null}
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap2: { gap: 2 },
  body: { height: 96, paddingTop: spacing.md, textAlignVertical: "top" },
  subject: { fontSize: 15 },
});
