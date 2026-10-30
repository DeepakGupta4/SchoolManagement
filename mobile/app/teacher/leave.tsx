import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, AppText, Card, Button, TextField, Loading, Chips, type ChipOption } from "@/components";
import { listMyLeave, applyLeave, type LeaveRow } from "@/api/leave";
import { ApiError } from "@/api/client";
import { todayIso, prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontWeight } from "@/theme";

// Leave kinds — lowercased values, title-cased labels (matches the web form).
const TYPE_OPTIONS: ChipOption[] = [
  { label: "Casual", value: "casual" },
  { label: "Sick", value: "sick" },
  { label: "Earned", value: "earned" },
  { label: "Unpaid", value: "unpaid" },
];

// Status → the soft background + readable text tones it renders in.
const STATUS_TONE: Record<LeaveRow["status"], { bg: string; fg: string }> = {
  Pending: { bg: colors.warningSoft, fg: colors.warningText },
  Approved: { bg: colors.successSoft, fg: colors.successText },
  Rejected: { bg: colors.dangerSoft, fg: colors.dangerText },
};

// "casual" → "Casual leave", but never doubles up if it already reads "…leave".
function typeLabel(type: string): string {
  const base = type.trim();
  if (!base) return "Leave";
  const cased = base.charAt(0).toUpperCase() + base.slice(1);
  return /leave/i.test(cased) ? cased : `${cased} leave`;
}

export default function LeaveScreen() {
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<string>(TYPE_OPTIONS[0].value);
  const [from, setFrom] = useState<string>(todayIso());
  const [to, setTo] = useState<string>(todayIso());
  const [reason, setReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // My requests — reload whenever the screen regains focus.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listMyLeave());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your leave requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onSubmit = async () => {
    const t = type.trim();
    const f = from.trim();
    const dt = to.trim();
    const r = reason.trim();
    // All four fields required; dates are YYYY-MM-DD so a string compare orders them.
    if (!t || !f || !dt || !r) {
      setError("Pick a type, both dates and a reason.");
      return;
    }
    if (dt < f) {
      setError("The end date can't be before the start date.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const row = await applyLeave({ type: t, from: f, to: dt, reason: r });
      setRows((prev) => [row, ...prev]); // show it immediately, newest first
      setReason("");
      setMessage("Leave request submitted ✓");
    } catch (e) {
      // Server does the real calendar-date validation; surface its message.
      setError(e instanceof ApiError ? e.message : "Could not submit your request.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && rows.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your leave…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }}>
      <View>
        <AppText variant="title">My Leave</AppText>
        <AppText variant="muted">Apply for time off and track approvals.</AppText>
      </View>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="heading">Apply for leave</AppText>

        <View style={styles.field}>
          <AppText variant="label">Type</AppText>
          <Chips options={TYPE_OPTIONS} value={type} onChange={setType} />
        </View>

        <View style={styles.dates}>
          <View style={styles.flex}>
            <TextField
              label="From"
              value={from}
              onChangeText={setFrom}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="To"
              value={to}
              onChangeText={setTo}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <TextField
          label="Reason"
          value={reason}
          onChangeText={setReason}
          placeholder="Briefly, why you need the leave"
          multiline
          style={styles.reason}
        />

        {message ? <AppText style={{ color: colors.successText }}>{message}</AppText> : null}
        {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}
        <Button title={saving ? "Submitting…" : "Submit request"} onPress={onSubmit} loading={saving} />
      </Card>

      <AppText variant="heading">My requests</AppText>
      {rows.length === 0 ? (
        <AppText variant="muted">You haven&apos;t filed any leave yet.</AppText>
      ) : (
        rows.map((r) => (
          <Card key={r.id} style={styles.item}>
            <View style={styles.flex}>
              <AppText variant="heading" style={styles.itemTitle}>
                {typeLabel(r.type)}
              </AppText>
              <AppText variant="muted">
                {prettyDate(r.from)} → {prettyDate(r.to)} · {r.days} {r.days === 1 ? "day" : "days"}
              </AppText>
              {r.reason ? (
                <AppText variant="small" style={styles.reasonText}>
                  {r.reason}
                </AppText>
              ) : null}
            </View>
            <StatusBadge status={r.status} />
          </Card>
        ))
      )}
    </Screen>
  );
}

/** Pill showing the request's state in its tone (read-only — no edit/cancel). */
function StatusBadge({ status }: { status: LeaveRow["status"] }) {
  const tone = STATUS_TONE[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <AppText variant="small" style={{ color: tone.fg, fontWeight: fontWeight.semibold }}>
        {status}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  dates: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  reason: { height: 88, paddingTop: spacing.md, textAlignVertical: "top" },
  item: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  itemTitle: { fontSize: 15 },
  reasonText: { color: colors.muted, marginTop: 2 },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
