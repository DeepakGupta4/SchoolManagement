import { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { Avatar } from "./Avatar";
import { type School } from "@/api/schools";
import { colors, radius, spacing, fontSize, fontWeight, shadow } from "@/theme";

export interface AdmitCardSubject {
  subject: string;
  date: string;
  day: string;
  timing: string;
  room: string;
}

export interface AdmitCardData {
  studentName: string;
  rollNo: string;
  admissionNo?: string;
  className: string;
  section: string;
  examName: string;
  session: string;
  fatherName?: string;
  avatar?: string;
  subjects: AdmitCardSubject[];
}

const INSTRUCTIONS = [
  "Carry this admit card to every examination session.",
  "Reach the hall 30 minutes before the scheduled time.",
  "Mobile phones and smart watches are prohibited.",
  "Use of unfair means cancels the paper.",
  "Invalid without the principal's signature and school seal.",
];

/** A student's examination admit card — rendered live and exportable as a PDF. */
export function AdmitCardPreview({
  data,
  school,
  onClose,
}: {
  data: AdmitCardData | null;
  school: School | null;
  onClose: () => void;
}) {
  const [sharing, setSharing] = useState(false);

  const onShare = async () => {
    if (!data) return;
    setSharing(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: admitCardHtml(data, school) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      } else {
        Alert.alert("Saved", "The admit card PDF was saved to the app's files.");
      }
    } catch (e) {
      Alert.alert("Couldn't share", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSharing(false);
    }
  };

  const centre = school ? [school.name, school.address].filter(Boolean).join(", ") : "";

  return (
    <Modal visible={!!data} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.bar}>
            <AppText variant="heading">Admit card</AppText>
            <View style={styles.barActions}>
              <Pressable
                onPress={onShare}
                disabled={sharing || !data}
                style={[styles.shareBtn, (sharing || !data) && styles.shareOff]}
                accessibilityLabel="Share as PDF"
              >
                <Ionicons name="share-outline" size={16} color={colors.onPrimary} />
                <AppText style={styles.shareText}>{sharing ? "…" : "PDF"}</AppText>
              </Pressable>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {data ? (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              {/* School masthead */}
              <View style={styles.head}>
                {school?.logo ? (
                  <Image source={{ uri: school.logo }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Ionicons name="school-outline" size={22} color={colors.primary} />
                  </View>
                )}
                <View style={styles.flex}>
                  <AppText style={styles.schoolName} numberOfLines={2}>
                    {school?.name || "Your School"}
                  </AppText>
                  {school?.affiliation ? <AppText variant="small">{school.affiliation}</AppText> : null}
                  {school?.address ? <AppText variant="muted">{school.address}</AppText> : null}
                </View>
              </View>

              <View style={styles.band}>
                <AppText style={styles.bandTitle}>ADMIT CARD</AppText>
                <AppText style={styles.bandSub}>
                  {[data.examName, data.session].filter(Boolean).join("  ·  ")}
                </AppText>
              </View>

              {/* Candidate */}
              <View style={styles.candidate}>
                <Avatar name={data.studentName} uri={data.avatar} size={64} />
                <View style={styles.flex}>
                  <AppText style={styles.candidateName} numberOfLines={2}>
                    {data.studentName}
                  </AppText>
                  <Field label="Father / Guardian" value={data.fatherName || "—"} />
                  <Field label="Roll No." value={data.rollNo || "—"} />
                  {data.admissionNo ? <Field label="Admission No." value={data.admissionNo} /> : null}
                  <Field
                    label="Class"
                    value={`${data.className}${data.section ? ` · ${data.section}` : ""}`}
                  />
                </View>
              </View>

              {centre ? (
                <View style={styles.centre}>
                  <AppText variant="small" style={styles.centreLabel}>
                    Examination Centre
                  </AppText>
                  <AppText style={styles.centreName}>{centre}</AppText>
                </View>
              ) : null}

              {/* Timetable */}
              <AppText variant="label">Examination schedule</AppText>
              {data.subjects.length === 0 ? (
                <View style={styles.emptyTable}>
                  <AppText variant="muted">The timetable for this exam hasn't been published yet.</AppText>
                </View>
              ) : (
                <View style={styles.table}>
                  <View style={[styles.tr, styles.trHead]}>
                    <AppText style={[styles.th, styles.colSubject]}>Subject</AppText>
                    <AppText style={[styles.th, styles.colDate]}>Date</AppText>
                    <AppText style={[styles.th, styles.colTime]}>Time</AppText>
                    <AppText style={[styles.th, styles.colRoom]}>Room</AppText>
                  </View>
                  {data.subjects.map((s, i) => (
                    <View key={`${s.subject}-${i}`} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
                      <View style={styles.colSubject}>
                        <AppText style={styles.td}>{s.subject || "—"}</AppText>
                        {s.day ? <AppText style={styles.tdSub}>{s.day}</AppText> : null}
                      </View>
                      <AppText style={[styles.td, styles.colDate]}>{s.date || "—"}</AppText>
                      <AppText style={[styles.td, styles.colTime]}>{s.timing || "—"}</AppText>
                      <AppText style={[styles.td, styles.colRoom]}>{s.room || "—"}</AppText>
                    </View>
                  ))}
                </View>
              )}

              {/* Instructions */}
              <AppText variant="label">Instructions</AppText>
              <View style={styles.instructions}>
                {INSTRUCTIONS.map((line, i) => (
                  <AppText key={i} variant="small" style={styles.instruction}>
                    {i + 1}. {line}
                  </AppText>
                ))}
              </View>

              {/* Signatures */}
              <View style={styles.signs}>
                {["Candidate", "Class Teacher", "Principal"].map((label) => (
                  <View key={label} style={styles.sign}>
                    <View style={styles.signLine} />
                    <AppText variant="small" style={styles.muted}>
                      {label}
                    </AppText>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <AppText variant="small" style={styles.fieldLabel}>
        {label}
      </AppText>
      <AppText style={styles.fieldValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

/** A print-ready HTML admit card (used for the Share → PDF export). */
function admitCardHtml(d: AdmitCardData, school: School | null): string {
  const esc = (s: unknown) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const centre = school ? [school.name, school.address].filter(Boolean).join(", ") : "";
  const rows =
    d.subjects.length === 0
      ? `<tr><td colspan="4" class="muted">Timetable not published yet.</td></tr>`
      : d.subjects
          .map(
            (s) =>
              `<tr><td><b>${esc(s.subject)}</b>${s.day ? `<br/><span class="muted">${esc(s.day)}</span>` : ""}</td><td>${esc(s.date)}</td><td>${esc(s.timing)}</td><td>${esc(s.room)}</td></tr>`
          )
          .join("");
  const instr = INSTRUCTIONS.map((l) => `<li>${esc(l)}</li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{font-family:-apple-system,Helvetica,Arial,sans-serif;box-sizing:border-box}
body{margin:0;padding:24px;color:#0f172a}
.card{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
.head{display:flex;align-items:center;gap:16px;padding:16px 20px;border-bottom:2px solid #4f46e5}
.logo{width:52px;height:52px;object-fit:contain;border-radius:8px}
.sname{font-size:20px;font-weight:700;text-transform:uppercase;margin:0}
.muted{color:#64748b;font-size:11px}
.band{background:#0f172a;color:#fff;text-align:center;padding:6px}
.band b{letter-spacing:3px;font-size:13px}
.body{padding:20px}
.cand{display:flex;gap:16px;margin-bottom:14px}
.photo{width:64px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0}
dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0;font-size:12px}
dt{color:#64748b;font-weight:600}
.centre{background:#f1f5f9;border-radius:8px;padding:8px 12px;font-size:12px;margin-bottom:14px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #e2e8f0;padding:7px 10px;text-align:left}
th{background:#4f46e5;color:#fff;font-size:11px}
tr:nth-child(even) td{background:#f8fafc}
h4{font-size:11px;text-transform:uppercase;color:#64748b;margin:16px 0 6px}
ol{margin:0;padding-left:18px;font-size:10px;color:#475569;line-height:1.6}
.signs{display:flex;gap:24px;margin-top:36px}
.sign{flex:1;text-align:center;font-size:11px;color:#64748b}
.line{border-top:1px solid #94a3b8;margin-bottom:4px;height:28px}
</style></head><body><div class="card">
<div class="head">${school?.logo ? `<img src="${school.logo}" class="logo"/>` : ""}<div>
<p class="sname">${esc(school?.name || "School")}</p>
${school?.affiliation ? `<div class="muted">${esc(school.affiliation)}</div>` : ""}
${school?.address ? `<div class="muted">${esc(school.address)}</div>` : ""}</div></div>
<div class="band"><b>ADMIT CARD</b> <span class="muted" style="color:#cbd5e1">· ${esc([d.examName, d.session].filter(Boolean).join(" · "))}</span></div>
<div class="body">
<div class="cand">${d.avatar ? `<img src="${d.avatar}" class="photo"/>` : ""}<dl>
<dt>Candidate</dt><dd>${esc(d.studentName)}</dd>
<dt>Father / Guardian</dt><dd>${esc(d.fatherName || "—")}</dd>
<dt>Roll No.</dt><dd>${esc(d.rollNo || "—")}</dd>
${d.admissionNo ? `<dt>Admission No.</dt><dd>${esc(d.admissionNo)}</dd>` : ""}
<dt>Class</dt><dd>${esc(d.className)}${d.section ? ` · ${esc(d.section)}` : ""}</dd>
</dl></div>
${centre ? `<div class="centre"><b>Examination Centre:</b> ${esc(centre)}</div>` : ""}
<table><tr><th>Subject</th><th>Date</th><th>Time</th><th>Room</th></tr>${rows}</table>
<h4>Instructions</h4><ol>${instr}</ol>
<div class="signs"><div class="sign"><div class="line"></div>Candidate</div><div class="sign"><div class="line"></div>Class Teacher</div><div class="sign"><div class="line"></div>Principal</div></div>
</div></div></body></html>`;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
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
  closeBtn: { padding: spacing.xs },

  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  flex: { flex: 1 },
  muted: { color: colors.muted },

  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logo: { width: 52, height: 52, borderRadius: radius.md },
  logoFallback: { backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  schoolName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },

  band: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  bandTitle: { color: colors.onPrimary, fontWeight: fontWeight.bold, letterSpacing: 3, fontSize: fontSize.sm },
  bandSub: { color: colors.border, fontSize: fontSize.xs, marginTop: 2 },

  candidate: { flexDirection: "row", gap: spacing.md },
  candidateName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 4 },
  fieldRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, paddingVertical: 2 },
  fieldLabel: { color: colors.muted },
  fieldValue: { color: colors.text, fontWeight: fontWeight.medium, fontSize: fontSize.sm, flexShrink: 1 },

  centre: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  centreLabel: { color: colors.muted, fontWeight: fontWeight.semibold },
  centreName: { color: colors.text, fontWeight: fontWeight.medium, fontSize: fontSize.sm },

  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  tr: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  trHead: { backgroundColor: colors.primary },
  trAlt: { backgroundColor: colors.surfaceAlt },
  th: { color: colors.onPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.xs },
  td: { color: colors.text, fontSize: fontSize.xs },
  tdSub: { color: colors.muted, fontSize: 10 },
  colSubject: { flex: 2.2 },
  colDate: { flex: 1.6 },
  colTime: { flex: 1.6 },
  colRoom: { flex: 1 },

  emptyTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
  },

  instructions: { gap: 4 },
  instruction: { color: colors.muted },

  signs: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.xl },
  sign: { flex: 1, alignItems: "center" },
  signLine: { height: 28, alignSelf: "stretch", borderBottomWidth: 1, borderBottomColor: colors.borderStrong, marginBottom: 4 },
});
