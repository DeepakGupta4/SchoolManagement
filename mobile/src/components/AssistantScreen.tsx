import { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { AppText } from "./AppText";
import { ScreenHeader } from "./ScreenHeader";
import { TextField } from "./TextField";
import { chatWithAssistant, getCopilots, type ChatMsg, type Copilot } from "@/api/ai";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

const GREETING =
  "Hi! I'm the SchoolDeck assistant. Ask me how to do anything in the app — attendance, fees, exams, adding students — or about your school's numbers.";

const DEFAULT_PROMPTS = [
  "How do I mark attendance?",
  "How many students are active?",
  "How do I collect a fee?",
];

interface Msg {
  id: string;
  role: ChatMsg["role"];
  content: string;
}

let seq = 0;
const nextId = () => `m${++seq}`;

/**
 * The SchoolDeck AI assistant chat — a shared screen each role mounts at
 * app/<role>/assistant.tsx. Non-streaming: one POST per message. The persona +
 * school data are derived server-side from the JWT; we just pass the message,
 * the prior turns, and (optionally) the role's default copilot key.
 */
export function AssistantScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "greet", role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copilot, setCopilot] = useState<Copilot | null>(null);

  // Fetch the role's default persona once (optional — chat works without it).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getCopilots()
        .then((d) => {
          if (alive && d.copilots?.length) setCopilot(d.copilots[0]);
        })
        .catch(() => {
          /* personas are optional */
        });
      return () => {
        alive = false;
      };
    }, [])
  );

  const hasUserMsg = messages.some((m) => m.role === "user");
  const prompts = copilot?.prompts?.length ? copilot.prompts : DEFAULT_PROMPTS;

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    setInput("");
    // History = prior turns minus the display-only greeting (matches the web widget).
    const history: ChatMsg[] = messages
      .filter((m) => m.id !== "greet")
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((p) => [...p, { id: nextId(), role: "user", content }]);
    setSending(true);
    try {
      const res = await chatWithAssistant(content, history, copilot?.key);
      setMessages((p) => [...p, { id: nextId(), role: "assistant", content: res.reply }]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Couldn't reach the assistant. Please try again.";
      setMessages((p) => [...p, { id: nextId(), role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setSending(false);
    }
  };

  // Inverted list → newest at the bottom; a transient "typing" bubble leads it.
  const rendered: Msg[] = sending
    ? [{ id: "typing", role: "assistant", content: "…" }, ...[...messages].reverse()]
    : [...messages].reverse();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title="Assistant"
          subtitle={copilot?.name ? copilot.name : "Ask about anything in the app"}
          back
        />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          style={styles.flex}
          data={rendered}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <Bubble role={item.role} content={item.content} />}
        />

        {!hasUserMsg ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            keyboardShouldPersistTaps="handled"
          >
            {prompts.map((p) => (
              <Pressable key={p} style={styles.chip} onPress={() => send(p)} disabled={sending}>
                <AppText style={styles.chipText}>{p}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <TextField
              value={input}
              onChangeText={setInput}
              placeholder="Ask the assistant…"
              multiline
              style={styles.input}
            />
          </View>
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || sending}
            style={[styles.send, (!input.trim() || sending) && styles.sendOff]}
            accessibilityLabel="Send"
          >
            <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ role, content }: { role: ChatMsg["role"]; content: string }) {
  const mine = role === "user";
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleBot]}>
        <AppText style={mine ? styles.textMine : styles.textBot}>{content}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  list: { padding: spacing.lg, gap: spacing.sm },

  chips: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { color: colors.primaryText, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputWrap: { flex: 1 },
  input: { maxHeight: 120 },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendOff: { backgroundColor: colors.borderStrong },

  bubbleRow: { flexDirection: "row" },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "86%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  bubbleBot: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  textMine: { color: colors.onPrimary, fontSize: fontSize.md },
  textBot: { color: colors.text, fontSize: fontSize.md },
});
