import { useEffect, useMemo, useState, type ComponentType, type ReactElement } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { AppText } from "./AppText";
import { colors, spacing } from "@/theme";

type Props<T> = {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  /** Rows revealed per page; the window grows by this as you scroll to the end. */
  pageSize?: number;
  /** Change this (e.g. the active tab) to snap the window back to the first page. */
  resetKey?: string | number;
  ItemSeparatorComponent?: ComponentType | null;
  ListHeaderComponent?: ReactElement | null;
  emptyText?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * A FlatList that reveals rows a page at a time (client-side windowing): it renders
 * `pageSize` rows, then grows by `pageSize` as you scroll to the end. The FULL `data`
 * stays owned by the parent, so bulk actions (mark-all, save) are unaffected — only
 * RENDER is paged. Virtualized + paged = fast even on long lists.
 *
 * Drop it in as the single scroller of a `<Screen scroll={false}>`: put the page's
 * header/form/filters in `ListHeaderComponent` so they scroll with the list.
 */
export function PagedList<T>({
  data,
  renderItem,
  keyExtractor,
  pageSize = 15,
  resetKey,
  ItemSeparatorComponent,
  ListHeaderComponent,
  emptyText = "Nothing here yet.",
  refreshing,
  onRefresh,
  contentContainerStyle,
  style,
}: Props<T>) {
  const [count, setCount] = useState(pageSize);

  // Snap back to page 1 when the list is replaced (new fetch / tab switch).
  const rk = resetKey ?? data.length;
  useEffect(() => {
    setCount(pageSize);
  }, [rk, pageSize]);

  const visible = useMemo(() => data.slice(0, count), [data, count]);
  const hasMore = count < data.length;

  return (
    <FlatList
      style={[styles.flex, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      data={visible}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparatorComponent ?? undefined}
      ListHeaderComponent={ListHeaderComponent ?? undefined}
      ListEmptyComponent={<AppText variant="muted">{emptyText}</AppText>}
      onEndReached={() => {
        if (hasMore) setCount((c) => c + pageSize);
      }}
      onEndReachedThreshold={0.6}
      ListFooterComponent={
        hasMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null
      }
      showsVerticalScrollIndicator={false}
      refreshing={onRefresh ? !!refreshing : undefined}
      onRefresh={onRefresh}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.lg, flexGrow: 1, paddingBottom: spacing.lg },
  footer: { paddingVertical: spacing.md },
});
