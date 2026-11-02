import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { inr, type Payment } from "@/api/finance";
import { type School } from "@/api/schools";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  paid: { bg: colors.successSoft, fg: colors.successText, label: "Paid" },
  "pending-clearance": { bg: colors.warningSoft, fg: colors.warningText, label: "Pending clearance" },
  bounced: { bg: colors.dangerSoft, fg: colors.dangerText, label: "Bounced" },
  cancelled: { bg: colors.surfaceAlt, fg: colors.muted, label: "Cancelled" },
};

/** A tapped receipt — full payment detail with Share (PDF) + Print. */
export function PaymentReceiptModal({
  payment,
  school,
  onClose,
}: {
  payment: Payment | null;
  school: School | null;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const p = payment;

  const onShare = async () => {
    if (!p) return;
    setBusy(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: receiptHtml(p, school) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      } else {
        Alert.alert("Saved", "The receipt PDF was saved to the app's files.");
      }
    } catch (e) {
      Alert.alert("Couldn't share", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onPrint = async () => {
    if (!p) return;
    setBusy(true);
    try {
      await Print.printAsync({ html: receiptHtml(p, school) });
    } catch (e) {
      // The user dismissing the print sheet also rejects — ignore that quietly.
      const msg = e instanceof Error ? e.message : "";
      if (msg && !/dismiss|cancel/i.test(msg)) Alert.alert("Couldn't print", msg);
    } finally {
      setBusy(false);
    }
  };

  const tone = p ? STATUS[p.status] ?? STATUS.paid : STATUS.paid;
  const voided = p?.status === "cancelled" || p?.status === "bounced";

  return (
    <Modal visible={!!p} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.bar}>
            <AppText variant="heading">Receipt</AppText>
            <View style={styles.barActions}>
              <Pressable onPress={onShare} disabled={busy || !p} style={[styles.pill, (busy || !p) && styles.off]} accessibilityLabel="Share as PDF">
                <Ionicons name="share-outline" size={16} color={colors.onPrimary} />
                <AppText style={styles.pillText}>PDF</AppText>
              </Pressable>
              <Pressable onPress={onPrint} disabled={busy || !p} style={[styles.pill, (busy || !p) && styles.off]} accessibilityLabel="Print">
                <Ionicons name="print-outline" size={16} color={colors.onPrimary} />
                <AppText style={styles.pillText}>Print</AppText>
              </Pressable>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {p ? (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <View style={styles.head}>
                <AppText style={styles.schoolName} numberOfLines={2}>
                  {school?.name || "Your School"}
                </AppText>
                {school?.address ? <AppText variant="muted">{school.address}</AppText> : null}
              </View>

              <View style={styles.band}>
                <AppText style={styles.bandTitle}>PAYMENT RECEIPT</AppText>
                <AppText style={styles.bandSub}>
                  {p.receiptNo}
                  {p.date ? `  ·  ${prettyDate(p.date)}` : ""}
                </AppText>
              </View>

              <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                <AppText variant="small" style={{ color: tone.fg, fontWeight: fontWeight.semibold }}>
                  {tone.label}
                </AppText>
              </View>

              <Row label="Student" value={p.studentName || "—"} />
              {p.admissionNo ? <Row label="Admission no." value={p.admissionNo} /> : null}
              {p.className ? <Row label="Class" value={p.className} /> : null}
              <Row label="Method" value={[p.method, p.bank].filter(Boolean).join(" · ") || "—"} />
              {p.reference ? <Row label="Reference" value={p.reference} /> : null}
              {p.collectedBy ? <Row label="Collected by" value={p.collectedBy} /> : null}
              {p.remarks ? <Row label="Remarks" value={p.remarks} /> : null}

              {p.allocations && p.allocations.length > 0 ? (
                <>
                  <AppText variant="label" style={styles.allocLabel}>
                    Applied to
                  </AppText>
                  <View style={styles.table}>
                    {p.allocations.map((al, i) => (
                      <View key={`${al.head}-${i}`} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
                        <AppText style={styles.allocHead} numberOfLines={1}>
                          {al.head}
                        </AppText>
                        <AppText style={styles.allocAmt}>{inr(al.amount)}</AppText>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              <View style={styles.totalRow}>
                <AppText style={styles.totalLabel}>Amount {voided ? "(void)" : "paid"}</AppText>
                <AppText style={[styles.totalAmt, voided && styles.voided]}>{inr(p.amount)}</AppText>
              </View>

              {voided && p.reversalReason ? (
                <AppText variant="small" style={styles.reversal}>
                  {tone.label}: {p.reversalReason}
                </AppText>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="muted" style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText style={styles.rowValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

/** Print-ready HTML receipt. */
function receiptHtml(p: Payment, school: School | null): string {
  const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const allocRows = (p.allocations ?? [])
    .map((a) => `<tr><td>${esc(a.head)}</td><td class="r">${esc(inr(a.amount))}</td></tr>`)
    .join("");
  const row = (l: string, v: string) => (v ? `<tr><td class="l">${esc(l)}</td><td>${esc(v)}</td></tr>` : "");
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{font-family:-apple-system,Helvetica,Arial,sans-serif;box-sizing:border-box}
body{margin:0;padding:24px;color:#0f172a}
.card{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;max-width:520px;margin:0 auto}
.head{text-align:center;padding:16px 20px;border-bottom:2px solid #4f46e5}
.sname{font-size:20px;font-weight:700;margin:0;text-transform:uppercase}
.muted{color:#64748b;font-size:12px}
.band{background:#0f172a;color:#fff;text-align:center;padding:6px}
.band b{letter-spacing:3px;font-size:13px}
.body{padding:20px}
table{width:100%;border-collapse:collapse;font-size:13px}
.info td{padding:4px 0;vertical-align:top}
.info .l{color:#64748b;width:140px}
.alloc{margin-top:12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.alloc td{border-bottom:1px solid #e2e8f0;padding:7px 10px}
.alloc tr:last-child td{border-bottom:0}
.alloc tr:nth-child(even) td{background:#f8fafc}
.r{text-align:right}
.total{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:2px solid #e2e8f0}
.total b{font-size:20px}
h4{font-size:11px;text-transform:uppercase;color:#64748b;margin:16px 0 4px}
.foot{text-align:center;color:#94a3b8;font-size:10px;margin-top:20px}
</style></head><body><div class="card">
<div class="head"><p class="sname">${esc(school?.name || "School")}</p>${school?.address ? `<div class="muted">${esc(school.address)}</div>` : ""}</div>
<div class="band"><b>PAYMENT RECEIPT</b> <span class="muted" style="color:#cbd5e1">· ${esc(p.receiptNo)} · ${esc(prettyDate(p.date))}</span></div>
<div class="body">
<table class="info">
${row("Student", p.studentName)}
${row("Admission no.", p.admissionNo)}
${row("Class", p.className)}
${row("Method", [p.method, p.bank].filter(Boolean).join(" · "))}
${row("Reference", p.reference || "")}
${row("Collected by", p.collectedBy || "")}
${row("Status", STATUS[p.status]?.label ?? p.status)}
</table>
${allocRows ? `<h4>Applied to</h4><table class="alloc">${allocRows}</table>` : ""}
<div class="total"><span class="muted">Amount paid</span><b>${esc(inr(p.amount))}</b></div>
<div class="foot">This is a computer-generated receipt.</div>
</div></div></body></html>`;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  barActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  off: { opacity: 0.5 },
  pillText: { color: colors.onPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  closeBtn: { padding: spacing.xs },

  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  head: { alignItems: "center", gap: 2 },
  schoolName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, textAlign: "center" },
  band: { backgroundColor: colors.text, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center", marginTop: spacing.sm },
  bandTitle: { color: colors.onPrimary, fontWeight: fontWeight.bold, letterSpacing: 3, fontSize: fontSize.sm },
  bandSub: { color: colors.border, fontSize: fontSize.xs, marginTop: 2 },
  badge: { alignSelf: "center", borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3, marginBottom: spacing.xs },

  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: fontSize.sm },
  rowValue: { flex: 1, textAlign: "right", color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  allocLabel: { marginTop: spacing.md },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  tr: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  trAlt: { backgroundColor: colors.surfaceAlt },
  allocHead: { flex: 1, color: colors.text, fontSize: fontSize.sm },
  allocAmt: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 2, borderTopColor: colors.border },
  totalLabel: { color: colors.muted, fontSize: fontSize.sm },
  totalAmt: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  voided: { color: colors.muted, textDecorationLine: "line-through" },
  reversal: { color: colors.dangerText, marginTop: spacing.xs },
});
