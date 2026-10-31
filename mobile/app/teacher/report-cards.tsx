import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Loading, Chips, PagedList, type ChipOption } from "@/components";
import { getMyTeacher } from "@/api/teacher";
import { listExams } from "@/api/exams";
import { listClasses, type SchoolClass } from "@/api/classes";
import { getMarks, type MarkRow } from "@/api/marks";
import { getMySchool, type GradingScheme, type GradingBand } from "@/api/schools";
import { DEFAULT_GRADING_SCHEME, gradeForPercent } from "@/lib/grading";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

// Only the teacher's own classes feed the picker (calling getMarks for a class
// they don't teach would 403), so we keep the scope minimal.
interface Scope {
  classes: string[];
  classTeacherOf: string;
}

// One student's consolidated result for the chosen exam.
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

// Badge tone from the overall percentage.
function toneForPercent(pct: number): { bg: string; fg: string } {
  if (pct >= 75) return { bg: colors.successSoft, fg: colors.successText };
  if (pct >= 40) return { bg: colors.warningSoft, fg: colors.warningText };
  return { bg: colors.dangerSoft, fg: colors.dangerText };
}

export default function ReportCards() {
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope | null>(null);
  const [exams, setExams] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [scheme, setScheme] = useState<GradingScheme>(DEFAULT_GRADING_SCHEME);

  const [examName, setExamName] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");

  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Teacher scope, exams, classes + grading scheme — reload on focus.
  const loadRefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, ex, cl, sc] = await Promise.all([
        getMyTeacher(),
        listExams(),
        listClasses(),
        // A missing/unconfigured scheme must never break the screen.
        getMySchool()
          .then((s) => (s.gradingScheme?.bands?.length ? s.gradingScheme : DEFAULT_GRADING_SCHEME))
          .catch(() => DEFAULT_GRADING_SCHEME),
      ]);
      setScope({
        classes: (t.classes ?? []).filter(Boolean),
        classTeacherOf: t.classTeacherOf ?? "",
      });
      setExams(ex.map((e) => e.name).filter(Boolean));
      setClasses(cl);
      setScheme(sc);
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

  const examOptions: ChipOption[] = useMemo(
    () => exams.map((e) => ({ label: e, value: e })),
    [exams]
  );

  const classOptions: ChipOption[] = useMemo(() => {
    if (!scope) return [];
    return [...new Set([...scope.classes, scope.classTeacherOf].filter(Boolean))].map((c) => ({
      label: c,
      value: c,
    }));
  }, [scope]);

  const sectionOptions: ChipOption[] = useMemo(() => {
    const sections = classes.find((c) => c.name === className)?.sections ?? [];
    return sections.map((s) => ({ label: s, value: s }));
  }, [classes, className]);

  // Snap each picker to a valid value as options load / the class changes.
  useEffect(() => {
    if (!classOptions.length) return;
    if (!classOptions.some((o) => o.value === className)) {
      const pref =
        scope?.classTeacherOf && classOptions.some((o) => o.value === scope.classTeacherOf)
          ? scope.classTeacherOf
          : classOptions[0].value;
      setClassName(pref);
    }
  }, [classOptions, className, scope]);
  useEffect(() => {
    if (sectionOptions.length && !sectionOptions.some((o) => o.value === section)) {
      setSection(sectionOptions[0].value);
    }
  }, [sectionOptions, section]);
  useEffect(() => {
    if (examOptions.length && !examOptions.some((o) => o.value === examName)) {
      setExamName(examOptions[0].value);
    }
  }, [examOptions, examName]);

  // Saved marks for the chosen exam/class/section (all subjects).
  useEffect(() => {
    if (!examName || !className || !section) {
      setMarks([]);
      setExpandedId(null);
      return;
    }
    let alive = true;
    setSheetLoading(true);
    setExpandedId(null);
    getMarks(examName, className, section)
      .then((rows) => {
        if (!alive) return;
        setMarks(rows);
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
  }, [examName, className, section]);

  // Group marks by student → totals, percent and grade; sorted by roll.
  const reportRows: ReportRow[] = useMemo(() => {
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

  if (loading && !scope) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  if (!scope) {
    return (
      <Screen>
        <ScreenHeader title="Report Cards" back />
        <Card>
          <AppText style={{ color: colors.dangerText }}>
            {error ?? "Could not load your teacher profile."}
          </AppText>
        </Card>
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
          <View style={styles.field}>
            <AppText variant="label">Exam</AppText>
            <Chips options={examOptions} value={examName} onChange={setExamName} />
          </View>
        )}
        {classOptions.length === 0 ? (
          <AppText variant="muted">You don&apos;t have any classes assigned yet.</AppText>
        ) : (
          <View style={styles.field}>
            <AppText variant="label">Class</AppText>
            <Chips options={classOptions} value={className} onChange={setClassName} />
          </View>
        )}
        {classOptions.length > 0 ? (
          sectionOptions.length === 0 ? (
            <AppText variant="muted">This class has no sections set up.</AppText>
          ) : (
            <View style={styles.field}>
              <AppText variant="label">Section</AppText>
              <Chips options={sectionOptions} value={section} onChange={setSection} />
            </View>
          )
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
          emptyText={ready ? "No marks saved for this exam yet." : "Pick an exam, class and section above."}
          renderItem={({ item: r }) => {
            const tone = toneForPercent(r.percent);
            const open = expandedId === r.studentId;
            return (
              <Card style={styles.card}>
                <Pressable onPress={() => setExpandedId(open ? null : r.studentId)} style={styles.header}>
                  <View style={styles.rollName}>
                    <AppText variant="small" style={{ color: colors.primaryText }}>
                      {`#${r.roll}`}
                    </AppText>
                    <AppText style={styles.name} numberOfLines={1}>
                      {r.studentName}
                    </AppText>
                  </View>
                  <View style={styles.scoreCol}>
                    <AppText style={styles.score}>{`${r.total}/${r.outOf}`}</AppText>
                    <AppText variant="muted">{`${r.percent}%`}</AppText>
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
                    <View style={styles.remarkRow}>
                      <AppText variant="small">
                        {`${r.band.remark} · Grade point ${r.band.gradePoint}`}
                      </AppText>
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  card: { padding: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rollName: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text },
  scoreCol: { alignItems: "flex-end" },
  score: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  badge: {
    minWidth: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  subjects: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  subjectMark: { color: colors.text },
  remarkRow: { marginTop: spacing.xs },
  flex: { flex: 1 },
});
