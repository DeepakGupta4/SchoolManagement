import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Screen,
  ScreenHeader,
  AppText,
  Card,
  Button,
  Loading,
  Select,
  Avatar,
  ReportCardPreview,
  type ChipOption,
  type ReportCardData,
} from "@/components";
import { getChildReportCard, type ReportCardBundle } from "@/api/portal";
import { getMySchool, type School } from "@/api/schools";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

/** A child's report card (parent view) — pick an exam, see the full card, print /
 *  share the exact same printable the office uses. View-only: never edits marks. */
export default function ParentReportCard() {
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const childId = typeof id === "string" ? id : "";
  const [bundle, setBundle] = useState<ReportCardBundle | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [examName, setExamName] = useState("");
  const [loading, setLoading] = useState(true); // first load only (full-screen)
  const [switching, setSwitching] = useState(false); // an exam switch / refresh is in flight
  const [error, setError] = useState<string | null>(null); // first-load failure (full-screen)
  const [notice, setNotice] = useState<string | null>(null); // transient, non-destructive
  const [preview, setPreview] = useState(false);

  // First load — the only path that may show a full-screen error (no card yet).
  const loadInitial = useCallback(async () => {
    if (!childId) {
      setError("No child selected.");
      setLoading(false);
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const [rc, sch] = await Promise.all([getChildReportCard(childId), getMySchool().catch(() => null)]);
      setBundle(rc);
      setSchool(sch);
      setExamName(rc.selected);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the report card.");
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Fetch a given exam (switch or pull-to-refresh) WITHOUT tearing down the card
  // already on screen if it fails — the picker + last card stay, the error is inline.
  const fetchExam = useCallback(
    async (exam: string | undefined, optimistic?: string) => {
      if (!childId) return;
      if (optimistic !== undefined) setExamName(optimistic); // picker reflects the tap at once
      setSwitching(true);
      setNotice(null);
      try {
        const [rc, sch] = await Promise.all([getChildReportCard(childId, exam), getMySchool().catch(() => school)]);
        setBundle(rc);
        setSchool(sch);
        setExamName(rc.selected);
      } catch (e) {
        setNotice(e instanceof ApiError ? e.message : "Couldn't load that — showing the previous card.");
        setExamName(bundle?.selected ?? examName); // revert the picker to what's shown
      } finally {
        setSwitching(false);
      }
    },
    [childId, school, bundle, examName]
  );

  const onRefresh = useCallback(() => fetchExam(examName || undefined), [fetchExam, examName]);
  const onPickExam = useCallback((v: string) => fetchExam(v, v), [fetchExam]);

  const card = bundle?.reportCard ?? null;
  const examOptions: ChipOption[] = (bundle?.exams ?? []).map((e) => ({ label: e, value: e }));

  if (loading && !bundle) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading report card…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }} onRefresh={onRefresh}>
      <View>
        <ScreenHeader title="Report card" back />
        <AppText variant="muted">{typeof name === "string" ? name : "Your child"}</AppText>
      </View>

      {error && !bundle ? (
        <Card>
          <AppText variant="muted">{error}</AppText>
        </Card>
      ) : !card ? (
        <Card>
          <AppText variant="muted">No marks have been published for your child yet.</AppText>
        </Card>
      ) : (
        <>
          {notice ? (
            <Card style={styles.notice}>
              <AppText variant="small" style={styles.noticeText}>
                {notice}
              </AppText>
            </Card>
          ) : null}

          {examOptions.length > 1 ? (
            <Select label="Exam" value={examName} options={examOptions} onChange={onPickExam} />
          ) : null}

          {switching ? (
            <Loading label="Loading…" />
          ) : (
            <>
              {/* Summary */}
              <Card style={styles.summary}>
                <View style={styles.sumHead}>
                  <Avatar name={card.studentName} uri={card.avatar} size={44} />
                  <View style={styles.flex}>
                    <AppText variant="heading" numberOfLines={1}>
                      {card.studentName}
                    </AppText>
                    <AppText variant="small" style={styles.muted}>
                      {card.examName}
                      {card.className ? ` · ${card.className}` : ""}
                      {card.section ? ` · ${card.section}` : ""}
                    </AppText>
                  </View>
                  <View style={styles.gradeChip}>
                    <AppText style={styles.gradeChipText}>{card.grade || "—"}</AppText>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <Stat label="Total" value={`${card.total}/${card.outOf}`} />
                  <Stat label="Percent" value={`${card.percent}%`} />
                  {card.rank ? <Stat label="Rank" value={`${card.rank}${card.classSize ? `/${card.classSize}` : ""}`} /> : null}
                  {card.attendancePercent != null ? <Stat label="Attendance" value={`${card.attendancePercent}%`} /> : null}
                </View>
              </Card>

              {/* Subjects */}
              <Card style={styles.subjects}>
                <View style={[styles.subRow, styles.subHead]}>
                  <AppText variant="small" style={[styles.subName, styles.headText]}>
                    Subject
                  </AppText>
                  <AppText variant="small" style={[styles.subMarks, styles.headText]}>
                    Marks
                  </AppText>
                  <AppText variant="small" style={[styles.subGrade, styles.headText]}>
                    Grade
                  </AppText>
                </View>
                {card.subjects.length === 0 ? (
                  <AppText variant="muted" style={styles.pad}>
                    No subjects recorded for this exam.
                  </AppText>
                ) : (
                  card.subjects.map((s, i) => (
                    <View key={`${s.subject}-${i}`} style={styles.subRow}>
                      <AppText style={styles.subName} numberOfLines={1}>
                        {s.subject}
                      </AppText>
                      <AppText style={styles.subMarks}>
                        {s.marks}/{s.maxMarks}
                      </AppText>
                      <AppText style={styles.subGrade}>{s.grade}</AppText>
                    </View>
                  ))
                )}
              </Card>

              <Button title="View / Print report card" onPress={() => setPreview(true)} />
              <AppText variant="small" style={styles.hint}>
                View-only · opens the full printable report card
              </AppText>
            </>
          )}
        </>
      )}

      <ReportCardPreview data={preview && card ? (card as ReportCardData) : null} school={school} onClose={() => setPreview(false)} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText style={styles.statVal}>{value}</AppText>
      <AppText variant="small" style={styles.muted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  muted: { color: colors.muted },
  hint: { color: colors.subtle, textAlign: "center" },

  notice: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
  noticeText: { color: colors.warningText },

  summary: { gap: spacing.md },
  sumHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  gradeChip: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  gradeChipText: { color: colors.primaryText, fontWeight: fontWeight.bold, fontSize: fontSize.md },

  statRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: { flexGrow: 1, flexBasis: "22%", alignItems: "center", backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.sm },
  statVal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primaryText },

  subjects: { padding: 0, overflow: "hidden" },
  subRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  subHead: { backgroundColor: colors.surfaceAlt },
  headText: { color: colors.muted, fontWeight: fontWeight.semibold },
  subName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  subMarks: { width: 80, textAlign: "center", fontSize: fontSize.sm, color: colors.text },
  subGrade: { width: 52, textAlign: "center", fontSize: fontSize.sm, color: colors.text },
  pad: { padding: spacing.md },
});
