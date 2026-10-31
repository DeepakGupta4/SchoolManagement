import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, View, type DimensionValue } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  ScreenHeader,
  AppText,
  Card,
  Button,
  AddButton,
  TextField,
  Loading,
  Chips,
  PagedList,
  type ChipOption,
} from "@/components";
import { getMyTeacher, teacherName } from "@/api/teacher";
import {
  listStudyMaterial,
  createStudyMaterial,
  type StudyMaterial,
  listOnlineClasses,
  createOnlineClass,
  type OnlineClass,
  listSyllabus,
  updateSyllabus,
  type Syllabus,
} from "@/api/lms";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

type Tab = "material" | "classes" | "syllabus";
const TABS: ChipOption[] = [
  { label: "Material", value: "material" },
  { label: "Classes", value: "classes" },
  { label: "Syllabus", value: "syllabus" },
];

/** Teacher LMS: share study material, schedule online classes, track syllabus. */
export default function Teaching() {
  const [tab, setTab] = useState<Tab>("material");
  const [me, setMe] = useState({ name: "", klass: "" });

  const [material, setMaterial] = useState<StudyMaterial[]>([]);
  const [classes, setClasses] = useState<OnlineClass[]>([]);
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Material + class forms.
  const [mTitle, setMTitle] = useState("");
  const [mSubject, setMSubject] = useState("");
  const [mUrl, setMUrl] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [cTopic, setCTopic] = useState("");
  const [cSubject, setCSubject] = useState("");
  const [cWhen, setCWhen] = useState("");
  const [cPlatform, setCPlatform] = useState("");
  const [cLink, setCLink] = useState("");

  const loadMe = useCallback(async () => {
    try {
      const t = await getMyTeacher();
      setMe({ name: teacherName(t), klass: t.classTeacherOf || t.classes?.[0] || "" });
    } catch {
      /* ignore — forms still work, class just isn't prefilled */
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadMe();
    }, [loadMe])
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (tab === "material") setMaterial(await listStudyMaterial());
      else if (tab === "classes") setClasses(await listOnlineClasses());
      else setSyllabus(await listSyllabus());
    } catch (e) {
      // These modules are Standard-plan+ — a Starter plan 402s.
      if (e instanceof ApiError && e.status === 402) setError("This is a Standard-plan feature.");
      else setError(e instanceof ApiError ? e.message : "Could not load.");
    } finally {
      setLoading(false);
    }
  }, [tab]);
  useEffect(() => {
    load();
  }, [load]);

  // Switching tabs resets the transient UI (form + search) so nothing leaks across.
  useEffect(() => {
    setShowForm(false);
    setSearch("");
    setMessage(null);
    setError(null);
  }, [tab]);

  const addMaterial = async () => {
    if (!mTitle.trim()) {
      setError("Give the material a title.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createStudyMaterial({
        title: mTitle.trim(),
        subject: mSubject.trim(),
        klass: me.klass,
        description: mDesc.trim(),
        url: mUrl.trim(),
        uploader: me.name,
        visibility: "published",
      });
      setMTitle("");
      setMSubject("");
      setMUrl("");
      setMDesc("");
      setShowForm(false);
      setMessage("Material shared ✓");
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not share the material.");
    } finally {
      setSaving(false);
    }
  };

  const scheduleClass = async () => {
    if (!cTopic.trim()) {
      setError("Give the class a topic.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createOnlineClass({
        topic: cTopic.trim(),
        subject: cSubject.trim(),
        klass: me.klass,
        when: cWhen.trim(),
        platform: cPlatform.trim(),
        link: cLink.trim(),
        teacher: me.name,
        state: "scheduled",
      });
      setCTopic("");
      setCSubject("");
      setCWhen("");
      setCPlatform("");
      setCLink("");
      setShowForm(false);
      setMessage("Class scheduled ✓");
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not schedule the class.");
    } finally {
      setSaving(false);
    }
  };

  const markTopic = async (s: Syllabus) => {
    try {
      await updateSyllabus(s.id, { completedTopics: Math.min(s.topics, s.completedTopics + 1) });
      load();
    } catch {
      /* ignore */
    }
  };

  const addLabel = tab === "material" ? "Share material" : "Schedule class";

  const formCard = showForm ? (
    <Card style={styles.form}>
      <View style={styles.formHead}>
        <AppText variant="heading">{tab === "material" ? "Share study material" : "Schedule online class"}</AppText>
        <Pressable onPress={() => setShowForm(false)} hitSlop={8} accessibilityLabel="Close form">
          <Ionicons name="close" size={20} color={colors.muted} />
        </Pressable>
      </View>
      {me.klass ? <AppText variant="muted">Class: {me.klass}</AppText> : null}
      {tab === "material" ? (
        <>
          <TextField label="Title" value={mTitle} onChangeText={setMTitle} />
          <TextField label="Subject" value={mSubject} onChangeText={setMSubject} />
          <TextField label="Link (URL)" value={mUrl} onChangeText={setMUrl} autoCapitalize="none" placeholder="https://…" />
          <TextField label="Notes" value={mDesc} onChangeText={setMDesc} multiline />
          <Button title="Share material" onPress={addMaterial} loading={saving} />
        </>
      ) : (
        <>
          <TextField label="Topic" value={cTopic} onChangeText={setCTopic} />
          <TextField label="Subject" value={cSubject} onChangeText={setCSubject} />
          <TextField label="When" value={cWhen} onChangeText={setCWhen} placeholder="Mon 10:00 AM" />
          <TextField label="Platform" value={cPlatform} onChangeText={setCPlatform} placeholder="Zoom / Google Meet" />
          <TextField label="Join link" value={cLink} onChangeText={setCLink} autoCapitalize="none" placeholder="https://…" />
          <Button title="Schedule class" onPress={scheduleClass} loading={saving} />
        </>
      )}
    </Card>
  ) : null;

  // Client-side search across the active tab.
  const q = search.trim().toLowerCase();
  const listData = useMemo<(StudyMaterial | OnlineClass | Syllabus)[]>(() => {
    if (tab === "material") {
      return material.filter(
        (m) => !q || [m.title, m.subject, m.klass].some((f) => (f ?? "").toLowerCase().includes(q))
      );
    }
    if (tab === "classes") {
      return classes.filter(
        (c) => !q || [c.topic, c.subject, c.when].some((f) => (f ?? "").toLowerCase().includes(q))
      );
    }
    return syllabus.filter(
      (s) => !q || [s.className, s.subject, s.unit, s.chapter].some((f) => (f ?? "").toLowerCase().includes(q))
    );
  }, [tab, material, classes, syllabus, q]);

  const total = tab === "material" ? material.length : tab === "classes" ? classes.length : syllabus.length;
  const countLabel =
    tab === "material"
      ? `${total} file${total === 1 ? "" : "s"}`
      : tab === "classes"
        ? `${total} class${total === 1 ? "" : "es"}`
        : `${total} entr${total === 1 ? "y" : "ies"}`;

  const header = (
    <View style={styles.header}>
      <View style={styles.headRow}>
        <AppText variant="muted">{countLabel}</AppText>
        {tab !== "syllabus" ? <AddButton label={addLabel} onPress={() => setShowForm((v) => !v)} /> : null}
      </View>
      {total > 0 ? (
        <TextField label="" value={search} onChangeText={setSearch} placeholder="Search…" autoCapitalize="none" />
      ) : null}
      {formCard}
    </View>
  );

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="Teaching" back />
      <Chips options={TABS} value={tab} onChange={(v) => setTab(v as Tab)} />

      {message ? <AppText style={{ color: colors.successText }}>{message}</AppText> : null}
      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}

      {loading ? (
        <>
          {header}
          <Loading />
        </>
      ) : (
        <PagedList
          data={listData}
          resetKey={`${tab}|${q}`}
          keyExtractor={(x) => {
            if (tab === "material") return (x as StudyMaterial).id ?? (x as StudyMaterial).title;
            if (tab === "classes") return (x as OnlineClass).id ?? (x as OnlineClass).topic;
            return (x as Syllabus).id;
          }}
          ListHeaderComponent={header}
          emptyText={
            q
              ? "No matches."
              : tab === "syllabus"
                ? "No syllabus entries yet."
                : tab === "material"
                  ? "No material shared yet. Tap “Share material”."
                  : "No classes scheduled yet. Tap “Schedule class”."
          }
          renderItem={({ item }) => {
            if (tab === "material") {
              const m = item as StudyMaterial;
              return (
                <Card style={styles.item}>
                  <View style={styles.thumb}>
                    <Ionicons name={m.url ? "link-outline" : "document-text-outline"} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="heading" style={styles.title} numberOfLines={2}>
                      {m.title}
                    </AppText>
                    <AppText variant="muted" numberOfLines={1}>
                      {[m.subject, m.klass, m.uploader].filter(Boolean).join(" · ") || "—"}
                    </AppText>
                  </View>
                  {m.url ? (
                    <Pressable onPress={() => Linking.openURL(m.url!)} style={styles.openBtn} accessibilityLabel="Open link">
                      <Ionicons name="open-outline" size={16} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </Card>
              );
            }
            if (tab === "classes") {
              const c = item as OnlineClass;
              const live = (c.state ?? "").toLowerCase() === "live";
              return (
                <Card style={styles.item}>
                  <View style={styles.thumb}>
                    <Ionicons name="videocam-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="heading" style={styles.title} numberOfLines={2}>
                      {c.topic}
                    </AppText>
                    <AppText variant="muted" numberOfLines={1}>
                      {[c.subject, c.when, c.platform].filter(Boolean).join(" · ") || "—"}
                    </AppText>
                  </View>
                  {c.state ? (
                    <View style={[styles.statePill, live && styles.livePill]}>
                      <AppText variant="small" style={[styles.statePillText, live && styles.livePillText]}>
                        {live ? "LIVE" : c.state}
                      </AppText>
                    </View>
                  ) : null}
                  {c.link ? (
                    <Pressable onPress={() => Linking.openURL(c.link!)} style={styles.openBtn} accessibilityLabel="Join">
                      <Ionicons name="enter-outline" size={16} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </Card>
              );
            }
            const s = item as Syllabus;
            const pct = s.topics > 0 ? Math.round((s.completedTopics / s.topics) * 100) : 0;
            const done = s.completedTopics >= s.topics && s.topics > 0;
            return (
              <Card style={styles.syllabus}>
                <View style={styles.syllabusHead}>
                  <View style={styles.flex}>
                    <AppText variant="heading" style={styles.title}>
                      {s.className} · {s.subject}
                    </AppText>
                    <AppText variant="muted">{[s.unit, s.chapter].filter(Boolean).join(" · ") || "—"}</AppText>
                  </View>
                  {done ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  ) : (
                    <Button title="+1" variant="outline" onPress={() => markTopic(s)} />
                  )}
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` as DimensionValue }, done && styles.barDone]} />
                </View>
                <AppText variant="small">
                  {s.completedTopics}/{s.topics} topics · {pct}%
                </AppText>
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
  header: { gap: spacing.md, marginBottom: spacing.md },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  form: { gap: spacing.sm },
  formHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  item: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15 },
  openBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  statePill: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statePillText: { color: colors.muted, fontWeight: fontWeight.semibold, textTransform: "capitalize" },
  livePill: { backgroundColor: colors.dangerSoft },
  livePillText: { color: colors.dangerText },

  syllabus: { gap: spacing.sm },
  syllabusHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  barDone: { backgroundColor: colors.success },
});
