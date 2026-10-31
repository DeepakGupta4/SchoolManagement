import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
// SDK 54+ moved the classic readAsStringAsync/EncodingType API to the /legacy entry.
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, TextField, Button, Loading } from "@/components";
import { getMyTeacher, teacherName } from "@/api/teacher";
import { listHomework, createHomework, type Homework } from "@/api/homework";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize } from "@/theme";

const MAX_BYTES = 3.5 * 1024 * 1024; // matches the app-wide file cap

type Picked = { dataUrl: string; name: string; mime: string; size: number };

export default function HomeworkScreen() {
  const [klass, setKlass] = useState("");
  const [teacher, setTeacher] = useState("");
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [due, setDue] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<Picked | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await getMyTeacher();
      const c = t.classTeacherOf || t.classes?.[0] || "";
      setKlass(c);
      setTeacher(teacherName(t));
      setItems(await listHomework(c || undefined));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const tooBig = (size: number) => {
    if (size > MAX_BYTES) {
      Alert.alert("File too large", "Please pick a file under 3.5 MB.");
      return true;
    }
    return false;
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.6 });
    const a = res.assets?.[0];
    if (res.canceled || !a?.base64) return;
    const size = a.fileSize ?? Math.floor((a.base64.length * 3) / 4);
    if (tooBig(size)) return;
    const mime = a.mimeType || "image/jpeg";
    setFile({ dataUrl: `data:${mime};base64,${a.base64}`, name: a.fileName || "photo.jpg", mime, size });
  };

  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*", "text/plain"],
      copyToCacheDirectory: true,
    });
    const a = res.assets?.[0];
    if (res.canceled || !a) return;
    if (a.size && tooBig(a.size)) return;
    const base64 = await FileSystem.readAsStringAsync(a.uri, { encoding: FileSystem.EncodingType.Base64 });
    const size = a.size ?? Math.floor((base64.length * 3) / 4);
    if (tooBig(size)) return;
    const mime = a.mimeType || "application/octet-stream";
    setFile({ dataUrl: `data:${mime};base64,${base64}`, name: a.name || "file", mime, size });
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setDue("");
    setDescription("");
    setFile(null);
    setError(null);
  };

  const onPost = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setSaving(true);
    const body: Homework = {
      title: title.trim(),
      subject: subject.trim(),
      class: klass,
      teacher,
      given: new Date().toISOString().slice(0, 10),
      due: due.trim(),
      status: "upcoming",
      description: description.trim(),
      ...(file ? { fileDataUrl: file.dataUrl, fileName: file.name, mimeType: file.mime, fileSize: file.size } : {}),
    };
    try {
      await createHomework(body);
      resetForm();
      setComposing(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not post homework.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading homework…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }}>
      <ScreenHeader title="Homework" subtitle={klass ? `Class ${klass}` : undefined} />

      {composing ? (
        <Card style={styles.form}>
          <View style={styles.formHead}>
            <AppText variant="heading">New homework</AppText>
            <Pressable
              onPress={() => {
                resetForm();
                setComposing(false);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>
          <TextField
            label="Title"
            leftIcon="create-outline"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Chapter 4 exercises"
          />
          <TextField label="Subject" leftIcon="book-outline" value={subject} onChangeText={setSubject} />
          <TextField
            label="Due date (YYYY-MM-DD)"
            leftIcon="calendar-outline"
            value={due}
            onChangeText={setDue}
            placeholder="2026-11-05"
          />
          <TextField label="Instructions" value={description} onChangeText={setDescription} multiline />

          <View style={styles.fileRow}>
            <Button title="Attach photo" variant="outline" style={styles.flex} onPress={pickPhoto} />
            <Button title="Attach file" variant="outline" style={styles.flex} onPress={pickDoc} />
          </View>
          {file ? (
            <View style={styles.file}>
              <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
              <AppText variant="small" style={styles.flex} numberOfLines={1}>
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </AppText>
              <Pressable onPress={() => setFile(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove file">
                <Ionicons name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
          ) : null}

          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          <Button title="Post homework" onPress={onPost} loading={saving} />
        </Card>
      ) : (
        <Button title="+ New homework" onPress={() => setComposing(true)} />
      )}

      <AppText variant="heading">Posted{items.length ? ` · ${items.length}` : ""}</AppText>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={22} color={colors.primaryText} />
          </View>
          <AppText variant="muted">No homework posted yet.</AppText>
        </View>
      ) : (
        items.map((h) => (
          <Card key={h.id} style={styles.item}>
            <View style={styles.itemIcon}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" style={styles.itemTitle} numberOfLines={1}>
                {h.title}
              </AppText>
              <AppText variant="muted" numberOfLines={1}>
                {h.subject || "General"}
                {h.due ? ` · Due ${h.due}` : ""}
              </AppText>
            </View>
            {h.fileName ? <Ionicons name="attach-outline" size={18} color={colors.muted} /> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: spacing.sm },
  formHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fileRow: { flexDirection: "row", gap: spacing.sm },
  file: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: { color: colors.dangerText },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { fontSize: fontSize.md },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
