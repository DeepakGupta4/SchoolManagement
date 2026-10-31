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
  Chips,
  TextField,
  PagedList,
  AdmitCardPreview,
  type AdmitCardData,
  type AdmitCardSubject,
  type ChipOption,
} from "@/components";
import { getMyTeacher, type Teacher } from "@/api/teacher";
import { listStudents, studentFullName, type Student } from "@/api/students";
import { listExams } from "@/api/exams";
import { listExamSchedule, type ScheduledExam } from "@/api/examSchedule";
import { getMySchool, type School } from "@/api/schools";
import { ApiError } from "@/api/client";
import { weekday } from "@/lib/date";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

/** Normalise a class label so "Class 10", "10" and "10-A" line up regardless of prefix/case. */
const normClass = (v: string) => v.replace(/^class\s+/i, "").trim().toLowerCase();

/** A schedule row → one admit-card timetable line. */
function toSubject(row: ScheduledExam): AdmitCardSubject {
  return {
    subject: row.subject,
    date: row.date,
    day: weekday(row.date),
    timing: row.duration ? `${row.time} · ${row.duration}` : row.time,
    room: row.room,
  };
}

/**
 * Admit cards for a class teacher's OWN class only. The teacher picks an exam;
 * every student of their class gets a card with that exam's subject timetable.
 * Students are already class-scoped server-side, so no other class is reachable.
 */
export default function AdmitCards() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<ScheduledExam[]>([]);
  const [examNames, setExamNames] = useState<string[]>([]);
  const [exam, setExam] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const klass = teacher?.classTeacherOf ?? "";
  const section = teacher?.classTeacherSection ?? "";
  const isClassTeacher = !!(teacher?.isClassTeacher && klass);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await getMyTeacher();
      setTeacher(t);
      const cls = t.classTeacherOf ?? "";
      if (!(t.isClassTeacher && cls)) {
        setLoading(false);
        return; // gate screen handles the message
      }
      const [sch, roster, sched, exams] = await Promise.all([
        getMySchool().catch(() => null),
        listStudents({ className: cls, section: t.classTeacherSection, status: "active" }).catch(() => []),
        listExamSchedule().catch(() => [] as ScheduledExam[]),
        listExams().catch(() => []),
      ]);
      setSchool(sch);
      setStudents(roster);
      setSchedule(sched);
      const names = exams.map((e) => e.name).filter(Boolean);
      setExamNames(names);
      setExam((prev) => prev || names[0] || "");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load admit cards.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // The selected exam's papers for THIS class → timetable lines.
  const subjects = useMemo(() => {
    const code = section ? `${normClass(klass)}-${section.toLowerCase()}` : "";
    return schedule
      .filter((r) => (!exam || r.exam === exam) && (normClass(r.class) === normClass(klass) || (code && normClass(r.class) === code)))
      .map(toSubject)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [schedule, exam, klass, section]);

  const examOptions: ChipOption[] = examNames.map((n) => ({ label: n, value: n }));

  // Roster filtered by the search box, alphabetical.
  const roster = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...students]
      .filter((s) => {
        if (!q) return true;
        return (
          studentFullName(s).toLowerCase().includes(q) ||
          (s.rollNo ?? "").toLowerCase().includes(q) ||
          (s.admissionNo ?? "").toLowerCase().includes(q)
        );
      })
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

  if (!loading && !isClassTeacher) {
    return (
      <Screen style={{ gap: spacing.md }}>
        <ScreenHeader title="Admit Cards" back />
        <Card style={styles.gate}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.muted} />
          <AppText variant="heading">Class teachers only</AppText>
          <AppText variant="muted" style={styles.gateText}>
            Admit cards are generated for your own class. You can view them once you're set as a class teacher.
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="Admit Cards" back />

      {loading ? (
        <Loading label="Loading…" />
      ) : error ? (
        <Card>
          <AppText variant="muted">{error}</AppText>
        </Card>
      ) : (
        <PagedList
          data={roster}
          resetKey={`${exam}|${search}`}
          keyExtractor={(s) => (s as Student).id ?? (s as Student).admissionNo}
          emptyText="No students in your class yet."
          ListHeaderComponent={
            <View style={styles.header}>
              <Card style={styles.classCard}>
                <View style={styles.classIcon}>
                  <Ionicons name="people" size={18} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.classTitle}>
                    {klass}
                    {section ? ` · ${section}` : ""}
                  </AppText>
                  <AppText variant="muted">
                    {roster.length} student{roster.length === 1 ? "" : "s"} · {subjects.length} paper
                    {subjects.length === 1 ? "" : "s"} scheduled
                  </AppText>
                </View>
              </Card>

              {examOptions.length > 0 ? (
                <>
                  <AppText variant="label">Examination</AppText>
                  <Chips options={examOptions} value={exam} onChange={setExam} />
                </>
              ) : (
                <Card>
                  <AppText variant="muted">No exams created yet. Ask the office to add one.</AppText>
                </Card>
              )}

              {subjects.length === 0 && exam ? (
                <Card style={styles.noteCard}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.warningText} />
                  <AppText variant="small" style={styles.noteText}>
                    No timetable published for {exam} in {klass} yet. Cards will still open — the schedule
                    fills in once the office publishes it.
                  </AppText>
                </Card>
              ) : null}

              <TextField
                label=""
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, roll or admission no.…"
                autoCapitalize="none"
              />
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
                    <Ionicons name="document-text-outline" size={14} color={colors.primary} />
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
      )}

      <AdmitCardPreview data={previewData} school={school} onClose={() => setPreviewId(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gate: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  gateText: { textAlign: "center" },

  header: { gap: spacing.md, marginBottom: spacing.md },
  classCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  classTitle: { fontSize: fontSize.md },

  noteCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.warningSoft },
  noteText: { flex: 1, color: colors.warningText },

  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: 15 },
  cardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  cardPillText: { color: colors.primaryText, fontWeight: fontWeight.semibold },
});
