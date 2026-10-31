import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { todayIso } from "@/lib/date";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

/**
 * A dependency-free month calendar (no native modules, no image assets) so it
 * bundles and runs anywhere. Pure View/Pressable/Text + local-time date math.
 */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Parse/format YYYY-MM-DD in LOCAL time (string compare == chronological).
function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}
function fmt(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type Props = {
  value: string; // selected YYYY-MM-DD
  onSelect: (iso: string) => void;
  maxDate?: string; // latest selectable day (inclusive)
  minDate?: string; // earliest selectable day (inclusive)
};

export function MonthCalendar({ value, onSelect, maxDate, minDate }: Props) {
  const sel = parse(value);
  const [view, setView] = useState({ y: sel.y, m: sel.m });

  const firstWeekday = new Date(view.y, view.m, 1).getDay(); // 0..6 (Su..Sa)
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const todayStr = todayIso();

  // Leading blanks + day numbers, padded to whole weeks.
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const nextFirst = view.m === 11 ? fmt(view.y + 1, 0, 1) : fmt(view.y, view.m + 1, 1);
  const prevLast = view.m === 0 ? fmt(view.y - 1, 11, 31) : fmt(view.y, view.m - 1, 28);
  const nextDisabled = !!maxDate && nextFirst > maxDate;
  const prevDisabled = !!minDate && prevLast < minDate;

  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  return (
    <View>
      {/* Month header with steppers */}
      <View style={styles.head}>
        <Pressable onPress={prevMonth} disabled={prevDisabled} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={prevDisabled ? colors.border : colors.primary} />
        </Pressable>
        <AppText style={styles.title}>
          {MONTHS[view.m]} {view.y}
        </AppText>
        <Pressable onPress={nextMonth} disabled={nextDisabled} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={nextDisabled ? colors.border : colors.primary} />
        </Pressable>
      </View>

      {/* Weekday labels */}
      <View style={styles.week}>
        {WEEKDAYS.map((w) => (
          <View key={w} style={styles.cell}>
            <AppText style={styles.weekday}>{w}</AppText>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {weeks.map((w, wi) => (
        <View key={wi} style={styles.week}>
          {w.map((d, di) => {
            if (d === null) return <View key={di} style={styles.cell} />;
            const cellIso = fmt(view.y, view.m, d);
            const disabled = (!!maxDate && cellIso > maxDate) || (!!minDate && cellIso < minDate);
            const selected = cellIso === value;
            const isToday = cellIso === todayStr;
            return (
              <Pressable
                key={di}
                style={styles.cell}
                disabled={disabled}
                onPress={() => onSelect(cellIso)}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                accessibilityLabel={cellIso}
              >
                <View
                  style={[
                    styles.day,
                    selected && styles.daySelected,
                    !selected && isToday && styles.dayToday,
                  ]}
                >
                  <AppText
                    style={[
                      styles.dayText,
                      disabled && styles.dayTextDisabled,
                      !selected && isToday && styles.dayTextToday,
                      selected && styles.dayTextSelected,
                    ]}
                  >
                    {d}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  navBtn: { padding: spacing.xs },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },

  week: { flexDirection: "row" },
  cell: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  weekday: { fontSize: fontSize.xs, color: colors.muted, fontWeight: fontWeight.semibold },

  day: { width: 38, height: 38, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  daySelected: { backgroundColor: colors.primary },
  dayToday: { backgroundColor: colors.primarySoft },
  dayText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  dayTextDisabled: { color: colors.subtle },
  dayTextToday: { color: colors.primaryText, fontWeight: fontWeight.bold },
  dayTextSelected: { color: colors.onPrimary, fontWeight: fontWeight.bold },
});
