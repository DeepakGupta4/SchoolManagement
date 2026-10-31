import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { Avatar } from "./Avatar";
import { type School } from "@/api/schools";
import { colors, radius, spacing, fontSize, fontWeight, shadow } from "@/theme";

export interface ReportCardData {
  examName: string;
  studentName: string;
  className: string;
  section: string;
  rollNo: string;
  admissionNo?: string;
  avatar?: string;
  attendancePercent?: number;
  subjects: { subject: string; marks: number; maxMarks: number; grade: string }[];
  total: number;
  outOf: number;
  percent: number;
  grade: string;
  gradePoint: number;
  remark: string;
  rank?: number;
  classSize?: number;
}

const DEFAULT_TEMPLATE = {
  title: "Report Card",
  subtitle: "",
  footerNote: "",
  principalName: "",
  classTeacherLabel: "Class Teacher",
  showAttendance: true,
  showRank: true,
  showGradePoint: true,
  showRemarks: true,
  showSignatures: true,
};

/** A student's report card, rendered from the school's admin-set template. */
export function ReportCardPreview({
  data,
  school,
  onClose,
}: {
  data: ReportCardData | null;
  school: School | null;
  onClose: () => void;
}) {
  const t = school?.reportCardTemplate ?? DEFAULT_TEMPLATE;

  return (
    <Modal visible={!!data} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.bar}>
            <AppText variant="heading">Report card</AppText>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {data ? (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <View style={styles.card}>
                {/* School header */}
                <View style={styles.schoolHead}>
                  {school?.logo ? (
                    <Image source={{ uri: school.logo }} style={styles.logo} resizeMode="contain" />
                  ) : null}
                  <View style={styles.flex}>
                    <AppText style={styles.schoolName} numberOfLines={2}>
                      {school?.name || "School"}
                    </AppText>
                    {school?.affiliation ? <AppText variant="small">{school.affiliation}</AppText> : null}
                    {school?.address ? (
                      <AppText variant="small" style={styles.muted}>
                        {school.address}
                      </AppText>
                    ) : null}
                  </View>
                </View>

                <View style={styles.titleWrap}>
                  <AppText style={styles.title}>{t.title}</AppText>
                  {t.subtitle ? <AppText variant="muted">{t.subtitle}</AppText> : null}
                  <AppText variant="small" style={styles.muted}>
                    {data.examName}
                    {school?.sessionLabel ? ` · ${school.sessionLabel}` : ""}
                  </AppText>
                </View>

                {/* Student */}
                <View style={styles.student}>
                  <Avatar name={data.studentName} uri={data.avatar} size={52} />
                  <View style={styles.flex}>
                    <AppText variant="heading" numberOfLines={1}>
                      {data.studentName}
                    </AppText>
                    <AppText variant="small" style={styles.muted}>
                      Class {data.className}
                      {data.section ? ` · ${data.section}` : ""} · Roll {data.rollNo}
                      {data.admissionNo ? ` · ${data.admissionNo}` : ""}
                    </AppText>
                  </View>
                </View>

                {/* Marks table */}
                <View style={styles.table}>
                  <View style={[styles.tr, styles.th]}>
                    <AppText style={[styles.cellSub, styles.thText]}>Subject</AppText>
                    <AppText style={[styles.cellNum, styles.thText]}>Marks</AppText>
                    <AppText style={[styles.cellGr, styles.thText]}>Grade</AppText>
                  </View>
                  {data.subjects.map((s, i) => (
                    <View key={`${s.subject}-${i}`} style={styles.tr}>
                      <AppText style={styles.cellSub} numberOfLines={1}>
                        {s.subject}
                      </AppText>
                      <AppText style={styles.cellNum}>
                        {s.marks}/{s.maxMarks}
                      </AppText>
                      <AppText style={styles.cellGr}>{s.grade}</AppText>
                    </View>
                  ))}
                  <View style={[styles.tr, styles.trTotal]}>
                    <AppText style={[styles.cellSub, styles.bold]}>Total</AppText>
                    <AppText style={[styles.cellNum, styles.bold]}>
                      {data.total}/{data.outOf}
                    </AppText>
                    <AppText style={[styles.cellGr, styles.bold]}>{data.percent}%</AppText>
                  </View>
                </View>

                {/* Summary chips */}
                <View style={styles.summary}>
                  <Stat label="Grade" value={data.grade} />
                  {t.showGradePoint ? <Stat label="Grade point" value={String(data.gradePoint)} /> : null}
                  {t.showRank && data.rank ? (
                    <Stat label="Rank" value={`${data.rank}${data.classSize ? `/${data.classSize}` : ""}`} />
                  ) : null}
                  {t.showAttendance && data.attendancePercent != null ? (
                    <Stat label="Attendance" value={`${data.attendancePercent}%`} />
                  ) : null}
                </View>

                {t.showRemarks && data.remark ? (
                  <AppText variant="small" style={styles.remark}>
                    <AppText style={styles.bold}>Remark: </AppText>
                    {data.remark}
                  </AppText>
                ) : null}

                {t.showSignatures ? (
                  <View style={styles.signs}>
                    <View style={styles.signCol}>
                      <View style={styles.signLine} />
                      <AppText variant="small" style={styles.muted}>
                        {t.classTeacherLabel}
                      </AppText>
                    </View>
                    <View style={styles.signCol}>
                      {school?.signatureUrl ? (
                        <Image source={{ uri: school.signatureUrl }} style={styles.sign} resizeMode="contain" />
                      ) : (
                        <View style={styles.signLine} />
                      )}
                      <AppText variant="small" style={styles.muted}>
                        {t.principalName || "Principal"}
                      </AppText>
                    </View>
                  </View>
                ) : null}

                {t.footerNote ? (
                  <AppText variant="small" style={styles.footer}>
                    {t.footerNote}
                  </AppText>
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
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
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  flex: { flex: 1 },
  muted: { color: colors.muted },
  bold: { fontWeight: fontWeight.bold, color: colors.text },

  schoolHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logo: { width: 48, height: 48, borderRadius: radius.sm },
  schoolName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },

  titleWrap: {
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primaryText },

  student: { flexDirection: "row", alignItems: "center", gap: spacing.md },

  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  tr: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  th: { backgroundColor: colors.surfaceAlt },
  thText: { color: colors.muted, fontWeight: fontWeight.semibold, fontSize: fontSize.xs },
  trTotal: { backgroundColor: colors.surfaceAlt, borderTopWidth: 1, borderColor: colors.border },
  cellSub: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  cellNum: { width: 72, textAlign: "center", fontSize: fontSize.sm, color: colors.text },
  cellGr: { width: 48, textAlign: "center", fontSize: fontSize.sm, color: colors.text },

  summary: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: {
    flexGrow: 1,
    flexBasis: "22%",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  statVal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primaryText },

  remark: { color: colors.text },

  signs: { flexDirection: "row", gap: spacing.xl, marginTop: spacing.md },
  signCol: { flex: 1, alignItems: "center", gap: 4 },
  signLine: { height: 1, backgroundColor: colors.borderStrong, alignSelf: "stretch", marginTop: spacing.xl },
  sign: { width: 90, height: 40 },

  footer: { color: colors.subtle, textAlign: "center", marginTop: spacing.sm },
});
