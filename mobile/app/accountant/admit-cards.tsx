import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  ScreenHeader,
  AppText,
  Card,
  Avatar,
  Loading,
  Select,
  TextField,
  PagedList,
  AdmitCardPreview,
  type AdmitCardData,
  type AdmitCardSubject,
  type ChipOption,
} from "@/components";
import { listStudents, studentFullName, type Student } from "@/api/students";
import { listExams } from "@/api/exams";
import { listClasses, type SchoolClass } from "@/api/classes";
import { listExamSchedule, type ScheduledExam } from "@/api/examSchedule";
import { getMySchool, type School } from "@/api/schools";
import { ApiError } from "@/api/client";
import { weekday } from "@/lib/date";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

const normClass = (v: string) => v.replace(/^class\s+/i, "").trim().toLowerCase();

function toSubject(row: ScheduledExam): AdmitCardSubject {
  return {
    subject: row.subject,
    date: row.date,
    day: weekday(row.date),
    timing: row.duration ? `${row.time} · ${row.duration}` : row.time,
    room: row.room,
  };
}

/** Accountant admit cards — any class (view + print only, never edit). */
export default function AdmitCards() {
  const [school, setSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [examNames, setExamNames] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ScheduledExam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [exam, setExam] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadRefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sch, cl, exams, sched] = await Promise.all([
        getMySchool().catch(() => null),
        listClasses().catch(() => [] as SchoolClass[]),
        listExams().catch(() => []),
        listExamSchedule().catch(() => [] as ScheduledExam[]),
      ]);
      setSchool(sch);
      setClasses(cl);
      setExamNames(exams.map((e) => e.name).filter(Boolean));
      setSchedule(sched);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load admit-card data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRefs();
    }, [loadRefs])
  );

  const examOptions = useMemo<ChipOption[]>(() => examNames.map((n) => ({ label: n, value: n })), [examNames]);
  const classOptions = useMemo<ChipOption[]>(() => classes.map((c) => ({ label: c.name, value: c.name })), [classes]);
  const sectionOptions = useMemo<ChipOption[]>(() => {
    const sections = classes.find((c) => c.name === className)?.sections ?? [];
    return sections.map((s) => ({ label: s, value: s }));
  }, [classes, className]);

  useEffect(() => {
    if (examOptions.length && !examOptions.some((o) => o.value === exam)) setExam(examOptions[0].value);
  }, [examOptions, exam]);
  useEffect(() => {
    if (classOptions.length && !classOptions.some((o) => o.value === className)) setClassName(classOptions[0].value);
  }, [classOptions, className]);
  useEffect(() => {
    if (sectionOptions.length && !sectionOptions.some((o) => o.value === section)) setSection(sectionOptions[0].value);
  }, [sectionOptions, section]);

  // Roster for the chosen class + section.
  useEffect(() => {
    if (!className || !section) {
      setStudents([]);
      return;
    }
    let alive = true;
    setRosterLoading(true);
    listStudents({ className, section, status: "active" })
      .then((s) => alive && setStudents(s))
      .catch(() => alive && setStudents([]))
      .finally(() => alive && setRosterLoading(false));
    return () => {
      alive = false;
    };
  }, [className, section, reloadKey]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRefs();
      setReloadKey((k) => k + 1); // re-fetch the roster too
    } finally {
      setRefreshing(false);
    }
  }, [loadRefs]);

  // The selected exam's papers for this class → timetable lines.
  const subjects = useMemo(() => {
    const code = section ? `${normClass(className)}-${section.toLowerCase()}` : "";
    return schedule
      .filter((r) => (!exam || r.exam === exam) && (normClass(r.class) === normClass(className) || (code && normClass(r.class) === code)))
      .map(toSubject)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [schedule, exam, className, section]);

  const roster = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...students]
      .filter((s) => !q || studentFullName(s).toLowerCase().includes(q) || (s.rollNo ?? "").toLowerCase().includes(q))
      .sort((a, b) => studentFullName(a).localeCompare(studentFullName(b)));
  }, [students, search]);

  const previewStudent = students.find((s) => s.id === previewId) ?? null;
  const previewData: AdmitCardData | null = previewStudent
    ? {
        studentName: studentFullName(previewStudent),
        rollNo: previewStudent.rollNo,
        admissionNo: previewStudent.admissionNo,
        className: previewStudent.className,
        section: previewStudent.section,
        examName: exam,
        session: school?.sessionLabel ?? "",
        fatherName: previewStudent.guardian?.name,
        avatar: previewStudent.avatar,
        subjects,
      }
    : null;

  if (loading && classes.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="Admit Cards" back />

      <PagedList
        data={roster}
        resetKey={`${exam}|${className}|${section}|${search}`}
        keyExtractor={(s) => (s as Student).id ?? (s as Student).admissionNo}
        refreshing={refreshing}
        onRefresh={refresh}
        emptyText={rosterLoading ? "Loading…" : "No students in this class."}
        ListHeaderComponent={
          <View style={styles.header}>
            <Card style={{ gap: spacing.md }}>
              {examOptions.length === 0 ? (
                <AppText variant="muted">No exams created yet — ask the office to add one.</AppText>
              ) : (
                <Select label="Examination" value={exam} options={examOptions} onChange={setExam} />
              )}
              {classOptions.length > 0 ? (
                <Select label="Class" value={className} options={classOptions} onChange={setClassName} />
              ) : null}
              {sectionOptions.length > 0 ? (
                <Select label="Section" value={section} options={sectionOptions} onChange={setSection} />
              ) : null}
            </Card>

            {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}

            {subjects.length === 0 && exam ? (
              <Card style={styles.noteCard}>
                <Ionicons name="information-circle-outline" size={18} color={colors.warningText} />
                <AppText variant="small" style={styles.noteText}>
                  No timetable published for {exam} in {className} yet — cards still open, the schedule fills in later.
                </AppText>
              </Card>
            ) : null}

            <TextField label="" value={search} onChangeText={setSearch} placeholder="Search name or roll…" autoCapitalize="none" />
            {roster.length > 0 ? (
              <AppText variant="muted">
                {roster.length} student{roster.length === 1 ? "" : "s"} · {subjects.length} paper
                {subjects.length === 1 ? "" : "s"}
              </AppText>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const s = item as Student;
          return (
            <Pressable onPress={() => setPreviewId(s.id ?? null)} disabled={!s.id}>
              <Card style={styles.row}>
                <Avatar name={studentFullName(s)} uri={s.avatar} size={40} />
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.name} numberOfLines={1}>
                    {studentFullName(s)}
                  </AppText>
                  <AppText variant="muted">
                    Roll {s.rollNo || "—"}
                    {s.admissionNo ? ` · ${s.admissionNo}` : ""}
                  </AppText>
                </View>
                <View style={styles.cardPill}>
                  <Ionicons name="reader-outline" size={14} color={colors.primary} />
                  <AppText variant="small" style={styles.cardPillText}>
                    Card
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Card>
            </Pressable>
          );
        }}
      />

      <AdmitCardPreview data={previewData} school={school} onClose={() => setPreviewId(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: spacing.xs },
  header: { gap: spacing.md, marginBottom: spacing.md },
  noteCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.warningSoft },
  noteText: { flex: 1, color: colors.warningText },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: 15 },
  cardPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  cardPillText: { color: colors.primaryText, fontWeight: fontWeight.semibold },
});
