import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { studentFullName, type Student } from "@/api/students";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontSize, fontWeight, shadow } from "@/theme";

type Props = {
  student: Student | null; // null = closed
  onClose: () => void;
  onEdit?: (id: string) => void;
};

/** Tap-a-student preview: the uploaded photo (large) + key details, read-only. */
export function StudentPreviewModal({ student, onClose, onEdit }: Props) {
  const s = student;
  const phone = s?.guardian?.phone || s?.phone;

  return (
    <Modal visible={!!s} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {s ? (
            <>
              <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>

              <View style={styles.head}>
                <Avatar name={studentFullName(s)} uri={s.avatar} size={96} />
                <AppText style={styles.name} numberOfLines={2}>
                  {studentFullName(s)}
                </AppText>
                <AppText variant="muted">
                  {s.className}
                  {s.section ? ` · ${s.section}` : ""}
                  {s.rollNo ? ` · Roll ${s.rollNo}` : ""}
                </AppText>
              </View>

              <ScrollView style={styles.details} showsVerticalScrollIndicator={false}>
                <Detail label="Admission no." value={s.admissionNo || "—"} />
                <Detail label="Date of birth" value={s.dateOfBirth ? prettyDate(s.dateOfBirth) : "—"} />
                <Detail label="Gender" value={cap(s.gender)} />
                <Detail
                  label="Guardian"
                  value={[s.guardian?.name, s.guardian?.relation].filter(Boolean).join(" · ") || "—"}
                />
                <Detail label="Guardian phone" value={s.guardian?.phone || "—"} />
                <Detail label="Email" value={s.email || "—"} />
                <Detail label="Address" value={s.address || "—"} last />
              </ScrollView>

              <View style={styles.actions}>
                {phone ? (
                  <Button
                    title="Call"
                    variant="outline"
                    onPress={() => Linking.openURL(`tel:${phone}`)}
                    style={styles.flex}
                  />
                ) : null}
                {onEdit && s.id ? (
                  <Button title="Edit" onPress={() => onEdit(s.id!)} style={styles.flex} />
                ) : null}
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Detail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <AppText variant="muted" style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText style={styles.detailValue} numberOfLines={3}>
        {value}
      </AppText>
    </View>
  );
}

function cap(v?: string) {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "—";
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "86%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.lg,
  },
  close: { position: "absolute", top: spacing.md, right: spacing.md, zIndex: 1, padding: spacing.xs },

  head: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.sm },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: "center" },

  details: { maxHeight: 240 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: fontSize.sm },
  detailValue: { flex: 1, textAlign: "right", color: colors.text, fontSize: fontSize.sm },

  actions: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
});
