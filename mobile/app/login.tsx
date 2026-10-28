import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, AppText, Button, TextField } from "@/components";
import { login } from "@/api/auth";
import { ApiError } from "@/api/client";
import { useAuth } from "@/store/auth";
import { colors, spacing } from "@/theme";

export default function Login() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [twoFa, setTwoFa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim(), password, twoFa ? code : undefined);
      if ("twoFactorRequired" in res) {
        setTwoFa(true); // password ok → now ask for the code
        return;
      }
      signIn(res.user);
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = !email || !password || (twoFa && code.length !== 6);

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="title">SchoolDeck</AppText>
        <AppText variant="muted">Sign in to your account</AppText>
      </View>

      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@school.com"
      />
      <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" />
      {twoFa ? (
        <TextField
          label="Authentication code"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
        />
      ) : null}

      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}

      <Button title={twoFa ? "Verify code" : "Sign in"} onPress={onSubmit} loading={loading} disabled={disabled} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center", gap: spacing.lg },
  header: { gap: spacing.xs, marginBottom: spacing.md },
});
