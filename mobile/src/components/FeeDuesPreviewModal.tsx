import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { accountBalance, inr, headBalance, type FeeAccount } from "@/api/finance";
import { type Student } from "@/api/students";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontSize, fontWeight, shadow } from "@/theme";

/** Tap-a-student on Fee Dues → full details + the per-head fee breakdown. */
export function FeeDuesPreviewModal({
  account,
  student,
  onClose,
}: {
  account: FeeAccount | null;
  student: Student | null;
  onClose: () => void;
}) {
  const a = account;
  const phone = a?.guardianPhone || student?.guardian?.phone || student?.phone || "";
  const outstanding = a ? accountBalance(a) : 0;

  return (
    <Modal visible={!!a} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {a ? (
            <>
              <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>

              <View style={styles.head}>
                <Avatar name={a.name} uri={student?.avatar} size={84} />
                <AppText style={styles.name} numberOfLines={2}>
                  {a.name}
                </AppText>
                <AppText variant="muted">
                  {[a.className, a.section].filter(Boolean).join(" · ")}
                  {a.rollNo ? ` · Roll ${a.rollNo}` : ""}
                </AppText>
                <View style={styles.duePill}>
                  <AppText style={styles.dueText}>{inr(outstanding)} outstanding</AppText>
                </View>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                <Detail label="Admission no." value={a.admissionNo || student?.admissionNo || "—"} />
                <Detail label="Guardian" value={[a.guardian || student?.guardian?.name, student?.guardian?.relation].filter(Boolean).join(" · ") || "—"} />
                <Detail label="Guardian phone" value={phone || "—"} />
                {student?.dateOfBirth ? <Detail label="Date of birth" value={prettyDate(student.dateOfBirth)} /> : null}
                {student?.email ? <Detail label="Email" value={student.email} /> : null}
                {student?.address ? <Detail label="Address" value={student.address} /> : null}

                {/* Fee breakdown */}
                <AppText variant="label" style={styles.breakLabel}>
                  Fee breakdown
                </AppText>
                <View style={styles.table}>
                  <View style={[styles.tr, styles.trHead]}>
                    <AppText style={[styles.th, styles.colHead]}>Head</AppText>
                    <AppText style={[styles.th, styles.colNum]}>Billed</AppText>
                    <AppText style={[styles.th, styles.colNum]}>Paid</AppText>
                    <AppText style={[styles.th, styles.colNum]}>Due</AppText>
                  </View>
                  {a.heads.map((h, i) => (
                    <View key={`${h.head}-${i}`} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
                      <AppText style={[styles.td, styles.colHead]} numberOfLines={1}>
                        {h.head}
                      </AppText>
                      <AppText style={[styles.td, styles.colNum]}>{inr(h.billed)}</AppText>
                      <AppText style={[styles.td, styles.colNum]}>{inr(h.paid)}</AppText>
                      <AppText style={[styles.td, styles.colNum, styles.dueCol]}>{inr(headBalance(h))}</AppText>
                    </View>
                  ))}
                  {a.lateFee > 0 ? (
                    <View style={styles.tr}>
                      <AppText style={[styles.td, styles.colHead]}>Late fee</AppText>
                      <AppText style={[styles.td, styles.colNum]}>—</AppText>
                      <AppText style={[styles.td, styles.colNum]}>—</AppText>
                      <AppText style={[styles.td, styles.colNum, styles.dueCol]}>{inr(a.lateFee)}</AppText>
                    </View>
                  ) : null}
                  {a.concession > 0 ? (
                    <View style={styles.tr}>
                      <AppText style={[styles.td, styles.colHead]}>Concession</AppText>
                      <AppText style={[styles.td, styles.colNum]}>—</AppText>
                      <AppText style={[styles.td, styles.colNum]}>—</AppText>
                      <AppText style={[styles.td, styles.colNum, styles.concCol]}>−{inr(a.concession)}</AppText>
                    </View>
                  ) : null}
                  <View style={[styles.tr, styles.trTotal]}>
                    <AppText style={[styles.td, styles.colHead, styles.totalText]}>Outstanding</AppText>
                    <AppText style={[styles.td, styles.colNum]}>—</AppText>
                    <AppText style={[styles.td, styles.colNum]}>—</AppText>
                    <AppText style={[styles.td, styles.colNum, styles.totalText]}>{inr(outstanding)}</AppText>
                  </View>
                </View>
              </ScrollView>

              {phone ? (
                <Button title="Call guardian" onPress={() => Linking.openURL(`tel:${phone}`)} />
              ) : null}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="muted" style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText style={styles.detailValue} numberOfLines={3}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.lg,
  },
  close: { position: "absolute", top: spacing.md, right: spacing.md, zIndex: 1, padding: spacing.xs },

  head: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.sm },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: "center" },
  duePill: { marginTop: spacing.xs, backgroundColor: colors.warningSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  dueText: { color: colors.warningText, fontWeight: fontWeight.bold },

  body: { maxHeight: 360 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: fontSize.sm },
  detailValue: { flex: 1, textAlign: "right", color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  breakLabel: { marginTop: spacing.md, marginBottom: spacing.xs },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  tr: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  trHead: { backgroundColor: colors.primary },
  trAlt: { backgroundColor: colors.surfaceAlt },
  trTotal: { backgroundColor: colors.surfaceAlt },
  th: { color: colors.onPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.xs },
  td: { color: colors.text, fontSize: fontSize.xs },
  colHead: { flex: 2 },
  colNum: { flex: 1.2, textAlign: "right" },
  dueCol: { color: colors.warningText, fontWeight: fontWeight.semibold },
  concCol: { color: colors.successText },
  totalText: { fontWeight: fontWeight.bold, color: colors.text },
});
