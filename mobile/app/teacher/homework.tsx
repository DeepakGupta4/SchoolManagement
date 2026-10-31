import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
// SDK 54+ moved the classic readAsStringAsync/EncodingType API to the /legacy entry.
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, TextField, Button, Loading, PagedList, AddButton } from "@/components";
import { getMyTeacher, teacherName } from "@/api/teacher";
import { listHomework, createHomework, type Homework } from "@/api/homework";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

const MAX_BYTES = 3.5 * 1024 * 1024; // matches the app-wide file cap

type Picked = { dataUrl: string; name: string; mime: string; size: number };

export default function HomeworkScreen() {
  const [klass, setKlass] = useState("");
  const [myClasses, setMyClasses] = useState<string[]>([]);
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
      // Every class this teacher can post to: their class-teacher class + all the
      // classes they teach (have periods in). Deduped, order preserved.
      const list = [...new Set([t.classTeacherOf, ...(t.classes ?? [])].filter(Boolean))] as string[];
      setMyClasses(list);
      setTeacher(teacherName(t));
      // Keep the current selection if still valid; else default to the class-teacher class.
      setKlass((prev) => (prev && list.includes(prev) ? prev : t.classTeacherOf || list[0] || ""));
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

  // Homework for the selected class — refetches whenever the class changes.
  useEffect(() => {
    if (!klass) {
      setItems([]);
      return;
    }
    let alive = true;
    listHomework(klass)
      .then((h) => alive && setItems(h))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [klass]);

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
      const created = await createHomework(body);
      setItems((p) => [created, ...p]);
      resetForm();
      setComposing(false);
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
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader
        title="Homework"
        subtitle={myClasses.length <= 1 && klass ? `Class ${klass}` : undefined}
        right={!composing && items.length > 0 ? <AddButton label="New" onPress={() => setComposing(true)} /> : undefined}
      />

      {myClasses.length > 1 ? (
        <View style={styles.classRow}>
          {myClasses.map((c) => {
            const on = c === klass;
            return (
              <Pressable
                key={c}
                onPress={() => setKlass(c)}
                style={[styles.classChip, on && styles.classChipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <AppText style={[styles.classChipText, on && styles.classChipTextOn]}>{c}</AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <PagedList
        data={items}
        keyExtractor={(h, i) => h.id ?? String(i)}
        pageSize={15}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          composing ? (
            <View />
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={30} color={colors.primary} />
              </View>
              <AppText variant="heading">No homework yet</AppText>
              <AppText variant="muted" style={styles.emptyText}>
                {`Post an assignment${klass ? ` for Class ${klass}` : ""} — it'll show up here.`}
              </AppText>
              <View style={styles.emptyAdd}>
                <AddButton label="New homework" onPress={() => setComposing(true)} />
              </View>
            </View>
          )
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
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
                {klass ? <AppText variant="muted">Posting to Class {klass}</AppText> : null}
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
            ) : null}

            {items.length > 0 ? <AppText variant="heading">Posted · {items.length}</AppText> : null}
          </View>
        }
        renderItem={({ item: h }) => (
          <Card style={styles.item}>
            <View style={styles.itemIcon}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" style={styles.itemTitle} numberOfLines={1}>
                {h.title}
              </AppText>
              <View style={styles.metaRow}>
                <View style={styles.chip}>
                  <AppText style={styles.chipText}>{h.subject || "General"}</AppText>
                </View>
                {h.due ? (
                  <View style={styles.due}>
                    <Ionicons name="calendar-outline" size={12} color={colors.warningText} />
                    <AppText style={styles.dueText}>Due {h.due}</AppText>
                  </View>
                ) : null}
                {h.fileName ? (
                  <View style={styles.attach}>
                    <Ionicons name="attach-outline" size={12} color={colors.muted} />
                    <AppText style={styles.attachText}>File</AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  emptyAdd: { marginTop: spacing.sm },
  classRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  classChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  classChipOn: { backgroundColor: colors.primary },
  classChipText: { color: colors.muted, fontWeight: fontWeight.medium, fontSize: fontSize.sm },
  classChipTextOn: { color: colors.onPrimary, fontWeight: fontWeight.semibold },
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
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs, marginTop: 4 },
  chip: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  chipText: { color: colors.primaryText, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  due: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dueText: { color: colors.warningText, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  attach: { flexDirection: "row", alignItems: "center", gap: 3 },
  attachText: { color: colors.muted, fontSize: fontSize.xs },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyText: { textAlign: "center" },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
