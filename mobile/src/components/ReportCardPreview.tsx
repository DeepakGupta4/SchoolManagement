import { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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
  const [sharing, setSharing] = useState(false);

  const onShare = async () => {
    if (!data) return;
    setSharing(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: reportCardHtml(data, school, t) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      } else {
        Alert.alert("Saved", "The report card PDF was saved to the app's files.");
      }
    } catch (e) {
      Alert.alert("Couldn't share", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={!!data} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.bar}>
            <AppText variant="heading">Report card</AppText>
            <View style={styles.barActions}>
              <Pressable
                onPress={onShare}
                disabled={sharing || !data}
                style={[styles.shareBtn, (sharing || !data) && styles.shareOff]}
                accessibilityRole="button"
                accessibilityLabel="Share as PDF"
              >
                <Ionicons name="share-outline" size={16} color={colors.onPrimary} />
                <AppText style={styles.shareText}>{sharing ? "…" : "PDF"}</AppText>
              </Pressable>
              <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
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

/** A print-ready HTML report card (used for the Share → PDF export). */
function reportCardHtml(d: ReportCardData, school: School | null, t: typeof DEFAULT_TEMPLATE): string {
  const esc = (s: unknown) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rows = d.subjects
    .map(
      (s) =>
        `<tr><td>${esc(s.subject)}</td><td class="c">${s.marks}/${s.maxMarks}</td><td class="c">${esc(s.grade)}</td></tr>`
    )
    .join("");
  const chip = (v: string, l: string) => `<div class="chip"><b>${esc(v)}</b><span>${esc(l)}</span></div>`;
  const chips = [
    chip(d.grade, "Grade"),
    t.showGradePoint ? chip(String(d.gradePoint), "Grade point") : "",
    t.showRank && d.rank ? chip(`${d.rank}${d.classSize ? `/${d.classSize}` : ""}`, "Rank") : "",
    t.showAttendance && d.attendancePercent != null ? chip(`${d.attendancePercent}%`, "Attendance") : "",
  ].join("");
  const signs = t.showSignatures
    ? `<div class="signs"><div class="sign"><div class="line"></div>${esc(t.classTeacherLabel)}</div>` +
      `<div class="sign">${school?.signatureUrl ? `<img src="${school.signatureUrl}" class="sig"/>` : `<div class="line"></div>`}${esc(t.principalName || "Principal")}</div></div>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{font-family:-apple-system,Helvetica,Arial,sans-serif;box-sizing:border-box}
body{margin:0;padding:24px;color:#0f172a}
.card{border:1px solid #e2e8f0;border-radius:12px;padding:24px}
.head{display:flex;align-items:center;gap:16px}
.logo{width:56px;height:56px;object-fit:contain;border-radius:8px}
.sname{font-size:22px;font-weight:700;margin:0}
.muted{color:#64748b;font-size:12px}
.band{border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:10px 0;text-align:center;margin-top:14px}
.title{font-size:18px;font-weight:700;color:#4338ca}
.stu{margin-top:16px;font-size:13px}.stu b{font-size:16px}
table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}
th{background:#f1f5f9;font-size:11px;color:#64748b}
.c{text-align:center}
tr.total td{background:#f1f5f9;font-weight:700}
.chips{display:flex;gap:8px;margin-top:14px}
.chip{flex:1;text-align:center;background:#f1f5f9;border-radius:8px;padding:8px}
.chip b{display:block;color:#4338ca;font-size:16px}.chip span{font-size:11px;color:#64748b}
.remark{margin-top:14px;font-size:13px}
.signs{display:flex;gap:40px;margin-top:40px}
.sign{flex:1;text-align:center;font-size:12px;color:#64748b}
.line{border-top:1px solid #94a3b8;margin-bottom:4px}.sig{height:40px}
.footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:16px}
</style></head><body><div class="card">
<div class="head">${school?.logo ? `<img src="${school.logo}" class="logo"/>` : ""}<div>
<p class="sname">${esc(school?.name || "School")}</p>
${school?.affiliation ? `<div>${esc(school.affiliation)}</div>` : ""}
${school?.address ? `<div class="muted">${esc(school.address)}</div>` : ""}</div></div>
<div class="band"><div class="title">${esc(t.title)}</div>${t.subtitle ? `<div class="muted">${esc(t.subtitle)}</div>` : ""}<div class="muted">${esc(d.examName)}${school?.sessionLabel ? ` &middot; ${esc(school.sessionLabel)}` : ""}</div></div>
<div class="stu"><b>${esc(d.studentName)}</b><br/>Class ${esc(d.className)}${d.section ? ` &middot; ${esc(d.section)}` : ""} &middot; Roll ${esc(d.rollNo)}${d.admissionNo ? ` &middot; ${esc(d.admissionNo)}` : ""}</div>
<table><tr><th>Subject</th><th class="c">Marks</th><th class="c">Grade</th></tr>${rows}<tr class="total"><td>Total</td><td class="c">${d.total}/${d.outOf}</td><td class="c">${d.percent}%</td></tr></table>
<div class="chips">${chips}</div>
${t.showRemarks && d.remark ? `<div class="remark"><b>Remark:</b> ${esc(d.remark)}</div>` : ""}
${signs}
${t.footerNote ? `<div class="footer">${esc(t.footerNote)}</div>` : ""}
</div></body></html>`;
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
  barActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  shareOff: { opacity: 0.5 },
  shareText: { color: colors.onPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
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
