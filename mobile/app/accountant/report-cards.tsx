import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  ScreenHeader,
  AppText,
  Card,
  Button,
  Loading,
  Select,
  Chips,
  Avatar,
  PagedList,
  ReportCardPreview,
  type ChipOption,
  type ReportCardData,
} from "@/components";
import { classSortKey } from "@/lib/classOrder";
import { listStudents, type Student } from "@/api/students";
import { listExams } from "@/api/exams";
import { listClasses, type SchoolClass } from "@/api/classes";
import { getMarks, type MarkRow } from "@/api/marks";
import { getMySchool, type School, type GradingScheme, type GradingBand } from "@/api/schools";
import { DEFAULT_GRADING_SCHEME, gradeForPercent } from "@/lib/grading";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

interface ReportRow {
  studentId: string;
  studentName: string;
  roll: number;
  subjects: MarkRow[];
  total: number;
  outOf: number;
  percent: number;
  band: GradingBand;
}

function toneForPercent(pct: number): { bg: string; fg: string } {
  if (pct >= 75) return { bg: colors.successSoft, fg: colors.successText };
  if (pct >= 40) return { bg: colors.warningSoft, fg: colors.warningText };
  return { bg: colors.dangerSoft, fg: colors.dangerText };
}

/** Accountant report cards — any class (view + print only, never edit). */
export default function ReportCards() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [scheme, setScheme] = useState<GradingScheme>(DEFAULT_GRADING_SCHEME);
  const [school, setSchool] = useState<School | null>(null);

  const [examName, setExamName] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");

  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [studentsById, setStudentsById] = useState<Record<string, Student>>({});
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadRefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ex, cl, sch] = await Promise.all([listExams(), listClasses(), getMySchool().catch(() => null)]);
      setExams(ex.map((e) => e.name).filter(Boolean));
      setClasses(cl);
      setSchool(sch);
      setScheme(sch?.gradingScheme?.bands?.length ? sch.gradingScheme : DEFAULT_GRADING_SCHEME);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load report-card data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRefs();
    }, [loadRefs])
  );

  const examOptions = useMemo<ChipOption[]>(() => exams.map((e) => ({ label: e, value: e })), [exams]);
  const classOptions = useMemo<ChipOption[]>(
    () =>
      [...classes]
        .sort((a, b) => classSortKey(a.name) - classSortKey(b.name))
        .map((c) => ({ label: c.name, value: c.name })),
    [classes]
  );
  const sectionOptions = useMemo<ChipOption[]>(() => {
    const sections = classes.find((c) => c.name === className)?.sections ?? [];
    return sections.map((s) => ({ label: s, value: s }));
  }, [classes, className]);

  useEffect(() => {
    if (examOptions.length && !examOptions.some((o) => o.value === examName)) setExamName(examOptions[0].value);
  }, [examOptions, examName]);
  useEffect(() => {
    if (classOptions.length && !classOptions.some((o) => o.value === className)) setClassName(classOptions[0].value);
  }, [classOptions, className]);
  useEffect(() => {
    if (sectionOptions.length && !sectionOptions.some((o) => o.value === section)) setSection(sectionOptions[0].value);
  }, [sectionOptions, section]);

  useEffect(() => {
    if (!examName || !className || !section) {
      setMarks([]);
      setExpandedId(null);
      return;
    }
    let alive = true;
    setSheetLoading(true);
    setExpandedId(null);
    Promise.all([
      getMarks(examName, className, section),
      listStudents({ className, section, status: "active" }).catch(() => [] as Student[]),
    ])
      .then(([rows, students]) => {
        if (!alive) return;
        setMarks(rows);
        setStudentsById(Object.fromEntries(students.map((s) => [String(s.id), s])));
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setMarks([]);
        setError(e instanceof ApiError ? e.message : "Could not load the marks.");
      })
      .finally(() => {
        if (alive) setSheetLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [examName, className, section, reloadKey]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRefs();
      setReloadKey((k) => k + 1); // re-fetch the current marks sheet too
    } finally {
      setRefreshing(false);
    }
  }, [loadRefs]);

  const reportRows = useMemo<ReportRow[]>(() => {
    const groups = new Map<string, MarkRow[]>();
    for (const m of marks) {
      const list = groups.get(m.studentId);
      if (list) list.push(m);
      else groups.set(m.studentId, [m]);
    }
    const rows: ReportRow[] = Array.from(groups.values()).map((subjects) => {
      const first = subjects[0];
      const total = subjects.reduce((s, m) => s + (Number(m.marks) || 0), 0);
      const outOf = subjects.reduce((s, m) => s + (Number(m.maxMarks) || 0), 0);
      const percent = outOf > 0 ? Math.round((total / outOf) * 100) : 0;
      return {
        studentId: first.studentId,
        studentName: first.studentName,
        roll: Number(first.roll) || 0,
        subjects: [...subjects].sort((a, b) => a.subject.localeCompare(b.subject)),
        total,
        outOf,
        percent,
        band: gradeForPercent(scheme, percent),
      };
    });
    return rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [marks, scheme]);

  const classAvg = reportRows.length
    ? Math.round(reportRows.reduce((s, r) => s + r.percent, 0) / reportRows.length)
    : 0;

  const rankById = useMemo(() => {
    // Match the web's tie-break: equal % → higher raw total ranks first.
    const sorted = [...reportRows].sort((a, b) => b.percent - a.percent || b.total - a.total);
    const m: Record<string, number> = {};
    sorted.forEach((r, i) => (m[r.studentId] = i + 1));
    return m;
  }, [reportRows]);

  const previewData = useMemo<ReportCardData | null>(() => {
    if (!previewFor) return null;
    const r = reportRows.find((x) => x.studentId === previewFor);
    if (!r) return null;
    const st = studentsById[previewFor];
    return {
      examName,
      studentName: r.studentName,
      className,
      section,
      rollNo: st?.rollNo ?? String(r.roll),
      admissionNo: st?.admissionNo,
      avatar: st?.avatar,
      attendancePercent: st?.attendancePercent,
      subjects: r.subjects.map((m) => ({
        subject: m.subject,
        marks: m.marks,
        maxMarks: m.maxMarks,
        grade: gradeForPercent(scheme, m.maxMarks > 0 ? Math.round((m.marks / m.maxMarks) * 100) : 0).grade,
      })),
      total: r.total,
      outOf: r.outOf,
      percent: r.percent,
      grade: r.band.grade,
      gradePoint: r.band.gradePoint,
      remark: r.band.remark,
      rank: rankById[r.studentId],
      classSize: reportRows.length,
    };
  }, [previewFor, reportRows, studentsById, examName, className, section, scheme, rankById]);

  if (loading && classes.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  const ready = !!examName && !!className && !!section;

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="Report Cards" back />

      <Card style={{ gap: spacing.md }}>
        {examOptions.length === 0 ? (
          <AppText variant="muted">No exams created yet — ask the office to add one.</AppText>
        ) : (
          <Select label="Exam" value={examName} options={examOptions} onChange={setExamName} />
        )}
        {classOptions.length === 0 ? (
          <AppText variant="muted">No classes set up yet.</AppText>
        ) : (
          <Select label="Class" value={className} options={classOptions} onChange={setClassName} />
        )}
        {sectionOptions.length > 0 ? (
          <View style={styles.field}>
            <AppText variant="label">Section</AppText>
            <Chips options={sectionOptions} value={section} onChange={setSection} />
          </View>
        ) : classOptions.length > 0 ? (
          <AppText variant="muted">This class has no sections set up.</AppText>
        ) : null}
      </Card>

      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}

      {ready && reportRows.length > 0 ? (
        <View style={styles.summaryRow}>
          <AppText variant="muted">
            {className} · {section} · {reportRows.length} students
          </AppText>
          <AppText variant="label">Class avg {classAvg}%</AppText>
        </View>
      ) : null}

      {ready && sheetLoading && reportRows.length === 0 ? (
        <Loading label="Loading report cards…" />
      ) : (
        <PagedList
          data={ready ? reportRows : []}
          resetKey={`${examName}|${className}|${section}`}
          keyExtractor={(r) => r.studentId}
          pageSize={20}
          refreshing={refreshing}
          onRefresh={refresh}
          emptyText={ready ? "No marks saved for this exam yet." : "Pick an exam, class and section above."}
          renderItem={({ item: r }) => {
            const tone = toneForPercent(r.percent);
            const open = expandedId === r.studentId;
            return (
              <Card style={styles.card}>
                <Pressable onPress={() => setExpandedId(open ? null : r.studentId)} style={styles.header}>
                  <Avatar name={r.studentName} uri={studentsById[r.studentId]?.avatar} size={40} />
                  <View style={styles.flex}>
                    <AppText style={styles.name} numberOfLines={1}>
                      {r.studentName}
                    </AppText>
                    <AppText variant="small" style={styles.sub} numberOfLines={1}>
                      Roll {studentsById[r.studentId]?.rollNo ?? r.roll} · {r.total}/{r.outOf} · {r.percent}%
                    </AppText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                    <AppText style={[styles.badgeText, { color: tone.fg }]}>{r.band.grade}</AppText>
                  </View>
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.subtle} />
                </Pressable>

                {open ? (
                  <View style={styles.subjects}>
                    {r.subjects.map((m) => (
                      <View key={m.subject} style={styles.subjectRow}>
                        <AppText variant="muted" style={styles.flex} numberOfLines={1}>
                          {m.subject}
                        </AppText>
                        <AppText variant="small" style={styles.subjectMark}>
                          {`${m.marks}/${m.maxMarks}`}
                        </AppText>
                      </View>
                    ))}
                    <Button title="View report card" variant="outline" onPress={() => setPreviewFor(r.studentId)} />
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      )}

      <ReportCardPreview data={previewData} school={school} onClose={() => setPreviewFor(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  card: { padding: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  sub: { color: colors.muted },
  badge: { minWidth: 36, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, alignItems: "center" },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  subjects: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  subjectMark: { color: colors.text },
  flex: { flex: 1 },
});
