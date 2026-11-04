import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { type Payment } from "@/api/finance";
import { type School } from "@/api/schools";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

/**
 * A tapped receipt — rendered from the SAME HTML the web fee desk prints
 * (frontend PaymentReceipt.tsx), so the on-screen view, the PDF and the print
 * are byte-identical to the browser receipt. Print + Share both use that HTML.
 */
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
  const html = p ? receiptHtml(p, school) : "";

  const onShare = async () => {
    if (!p) return;
    setBusy(true);
    try {
      const { uri } = await Print.printToFileAsync({ html });
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
      await Print.printAsync({ html });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg && !/dismiss|cancel/i.test(msg)) Alert.alert("Couldn't print", msg);
    } finally {
      setBusy(false);
    }
  };

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
            <WebView
              originWhitelist={["*"]}
              source={{ html }}
              style={styles.web}
              showsVerticalScrollIndicator={false}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const rupee = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** 12345 → "Twelve Thousand Three Hundred Forty Five" (ported from the web receipt). */
function amountInWords(value: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const under100 = (n: number): string =>
    n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
  const under1000 = (n: number): string =>
    n < 100 ? under100(n) : `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${under100(n % 100)}` : ""}`;
  if (value === 0) return "Zero";
  const parts: string[] = [];
  const units: [number, string][] = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ];
  let rest = Math.floor(value);
  for (const [divisor, label] of units) {
    const count = Math.floor(rest / divisor);
    if (count > 0) {
      parts.push(`${under1000(count)} ${label}`);
      rest %= divisor;
    }
  }
  if (rest > 0) parts.push(under1000(rest));
  return parts.join(" ");
}

/** The exact web fee receipt (frontend PaymentReceipt.tsx) as standalone HTML. */
function receiptHtml(p: Payment, school: School | null): string {
  const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const unconfirmed = p.status === "pending-clearance";
  const addr = [school?.address, school?.affiliation].filter(Boolean).join(" · ");
  const payer: [string, string][] = [
    ["Student", p.studentName],
    ["Receipt date", formatDate(p.date)],
    ["Admission no.", p.admissionNo],
    ["Class", p.className],
    ["Payment mode", p.method],
    ["Reference", p.reference || "—"],
  ];
  const payerHtml = payer
    .map(([l, v]) => `<div class="pr"><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`)
    .join("");
  const allocRows = (p.allocations ?? [])
    .map((a, i) => `<tr class="${i % 2 ? "alt" : ""}"><td>${esc(a.head)}</td><td class="r mono">${rupee(a.amount)}</td></tr>`)
    .join("");
  const logo = school?.logo
    ? `<div class="logo"><img src="${esc(school.logo)}"/></div>`
    : `<div class="logo plain"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=800"/>
<style>
*{box-sizing:border-box;font-family:-apple-system,Helvetica,Arial,sans-serif}
@page{size:A5 landscape;margin:8mm}
html,body{margin:0;background:#fff;color:#0f172a}
.receipt{padding:20px}
.mast{display:flex;align-items:center;gap:12px;border-bottom:2px solid #4f46e5;padding-bottom:12px}
.logo{width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;border:1px solid #e2e8f0}
.logo.plain{background:#4f46e5;border:0}
.logo img{width:100%;height:100%;object-fit:contain;padding:2px}
.sname{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;margin:0}
.saddr{font-size:9px;color:#64748b;margin:2px 0 0}
.rhead{margin-left:auto;text-align:right}
.rhead .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin:0}
.rno{font-family:ui-monospace,monospace;font-size:14px;font-weight:700;color:#4338ca;margin:2px 0 0}
.prov{margin-top:8px;border-radius:4px;background:#fffbeb;color:#92400e;font-size:9px;font-weight:600;padding:6px 10px}
dl.payer{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin:12px 0 0;font-size:10px}
.pr{display:flex;gap:8px}
.pr dt{width:112px;flex:none;font-weight:600;color:#64748b;margin:0}
.pr dd{margin:0;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
table{width:100%;border-collapse:collapse;font-size:10px;margin-top:12px;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden}
thead tr{background:#f1f5f9}
th{padding:6px 12px;text-align:left;font-weight:600}
th.r,td.r{text-align:right}
td{padding:6px 12px}
tbody tr.alt{background:#f8fafc}
.mono{font-family:ui-monospace,monospace}
tfoot tr{border-top:2px solid #cbd5e1;background:#eef2ff}
tfoot td{padding:8px 12px;font-weight:700}
tfoot td.tot{text-align:right;font-family:ui-monospace,monospace;font-size:14px;color:#4338ca}
.words{margin-top:8px;font-size:9px;font-style:italic;color:#475569}
.remarks{margin-top:4px;font-size:9px;color:#475569}
.foot{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-top:24px;font-size:8px;color:#64748b}
.foot .note{max-width:55%;line-height:1.35;margin:0;white-space:pre-line}
.sign{text-align:center}
.sign .by{font-weight:500;color:#334155;margin:0 0 2px}
.sign .line{width:128px;border-top:1px solid #94a3b8;padding-top:2px}
</style></head><body><div class="receipt">
<div class="mast">${logo}
<div style="min-width:0;flex:1">
<p class="sname">${esc(school?.name || "Your School")}</p>
${addr ? `<p class="saddr">${esc(addr)}</p>` : ""}
</div>
<div class="rhead"><p class="lbl">Fee Receipt</p><p class="rno">${esc(p.receiptNo)}</p></div>
</div>
${unconfirmed ? `<p class="prov">Subject to realisation — this receipt is provisional until the ${esc((p.method || "").toLowerCase())} clears.</p>` : ""}
<dl class="payer">${payerHtml}</dl>
<table><thead><tr><th>Particulars</th><th class="r">Amount</th></tr></thead>
<tbody>${allocRows || `<tr><td>Fee payment</td><td class="r mono">${rupee(p.amount)}</td></tr>`}</tbody>
<tfoot><tr><td>Total received</td><td class="tot">${rupee(p.amount)}</td></tr></tfoot></table>
<p class="words">Rupees ${esc(amountInWords(p.amount))} only</p>
${p.remarks ? `<p class="remarks"><b>Remarks:</b> ${esc(p.remarks)}</p>` : ""}
<div class="foot">
<p class="note">${esc(school?.receiptFooter || "This is a computer-generated receipt. Fees once paid are non-refundable except as provided in the school's refund policy.")}</p>
<div class="sign"><p class="by">${esc(p.collectedBy || "")}</p><div class="line">Authorised signatory</div></div>
</div>
</div></body></html>`;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  sheet: { height: "80%", backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: "hidden" },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  barActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  off: { opacity: 0.5 },
  pillText: { color: colors.onPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  closeBtn: { padding: spacing.xs },
  web: { flex: 1, backgroundColor: colors.surfaceAlt },
});
