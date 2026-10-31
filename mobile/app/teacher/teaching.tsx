import { useCallback, useEffect, useState } from "react";
import { Linking, StyleSheet, View, type DimensionValue } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, Button, TextField, Loading, Chips, type ChipOption } from "@/components";
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
import { colors, spacing } from "@/theme";

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

  return (
    <Screen style={{ gap: spacing.md }}>
      <ScreenHeader title="Teaching" back />
      <Chips options={TABS} value={tab} onChange={(v) => setTab(v as Tab)} />

      {message ? <AppText style={{ color: colors.successText }}>{message}</AppText> : null}
      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}

      {tab === "material" ? (
        <>
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">Share study material</AppText>
            {me.klass ? <AppText variant="muted">Class: {me.klass}</AppText> : null}
            <TextField label="Title" value={mTitle} onChangeText={setMTitle} />
            <TextField label="Subject" value={mSubject} onChangeText={setMSubject} />
            <TextField label="Link (URL)" value={mUrl} onChangeText={setMUrl} autoCapitalize="none" placeholder="https://…" />
            <TextField label="Notes" value={mDesc} onChangeText={setMDesc} multiline />
            <Button title="Share material" onPress={addMaterial} loading={saving} />
          </Card>
          {loading ? (
            <Loading />
          ) : (
            material.map((m) => (
              <Card key={m.id ?? m.title} style={styles.item}>
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.title}>
                    {m.title}
                  </AppText>
                  <AppText variant="muted">{[m.subject, m.klass].filter(Boolean).join(" · ") || "—"}</AppText>
                </View>
                {m.url ? <Button title="Open" variant="ghost" onPress={() => Linking.openURL(m.url!)} /> : null}
              </Card>
            ))
          )}
        </>
      ) : tab === "classes" ? (
        <>
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">Schedule online class</AppText>
            <TextField label="Topic" value={cTopic} onChangeText={setCTopic} />
            <TextField label="Subject" value={cSubject} onChangeText={setCSubject} />
            <TextField label="When" value={cWhen} onChangeText={setCWhen} placeholder="Mon 10:00 AM" />
            <TextField label="Platform" value={cPlatform} onChangeText={setCPlatform} placeholder="Zoom / Google Meet" />
            <TextField label="Join link" value={cLink} onChangeText={setCLink} autoCapitalize="none" placeholder="https://…" />
            <Button title="Schedule class" onPress={scheduleClass} loading={saving} />
          </Card>
          {loading ? (
            <Loading />
          ) : (
            classes.map((c) => (
              <Card key={c.id ?? c.topic} style={styles.item}>
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.title}>
                    {c.topic}
                  </AppText>
                  <AppText variant="muted">{[c.subject, c.when, c.state].filter(Boolean).join(" · ") || "—"}</AppText>
                </View>
                {c.link ? <Button title="Join" variant="ghost" onPress={() => Linking.openURL(c.link!)} /> : null}
              </Card>
            ))
          )}
        </>
      ) : loading ? (
        <Loading />
      ) : syllabus.length === 0 ? (
        <AppText variant="muted">No syllabus entries yet.</AppText>
      ) : (
        syllabus.map((s) => {
          const pct = s.topics > 0 ? Math.round((s.completedTopics / s.topics) * 100) : 0;
          return (
            <Card key={s.id} style={styles.item}>
              <View style={styles.flex}>
                <AppText variant="heading" style={styles.title}>
                  {s.className} · {s.subject}
                </AppText>
                <AppText variant="muted">{[s.unit, s.chapter].filter(Boolean).join(" · ") || "—"}</AppText>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` as DimensionValue }]} />
                </View>
                <AppText variant="small">
                  {s.completedTopics}/{s.topics} topics · {pct}%
                </AppText>
              </View>
              {s.completedTopics < s.topics ? (
                <Button title="+1" variant="outline" onPress={() => markTopic(s)} />
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: 15 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, marginTop: 6, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
