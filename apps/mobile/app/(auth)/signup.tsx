import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

const COLORS = {
  primary: "#4F46E5",
  accent: "#FBBF24",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  error: "#EF4444",
};

export default function SignupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim() || displayName.trim().length < 2) {
      newErrors.displayName = "Name must be at least 2 characters.";
    }
    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!password || password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignup() {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.auth.signup({
        email: email.trim().toLowerCase(),
        password,
        display_name: displayName.trim(),
      });

      if (!response.ok) {
        const body = await response.json();
        if (response.status === 409) {
          setErrors({ email: "An account with this email already exists." });
        } else if (response.status === 422 && body.fields) {
          setErrors(body.fields);
        } else {
          setErrors({ general: "Signup failed. Please try again." });
        }
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }

      const { session } = await response.json();
      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      router.replace("/onboarding");
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🔥</Text>
          </View>
          <Text style={styles.appName}>HabitAI</Text>
          <Text style={styles.tagline}>Your AI habit coach awaits</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start building better habits today</Text>

          {errors.general && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={[styles.input, errors.displayName ? styles.inputError : null]}
              placeholder="Your name"
              placeholderTextColor={COLORS.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
            />
            {errors.displayName && (
              <Text style={styles.fieldError}>{errors.displayName}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
            />
            {errors.email && (
              <Text style={styles.fieldError}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="Min. 8 characters"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="password-new"
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
            {errors.password && (
              <Text style={styles.fieldError}>{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By signing up you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 9999,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  logoEmoji: { fontSize: 36 },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  errorBox: {
    backgroundColor: "#FFF1F2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorText: { color: COLORS.error, fontSize: 14 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  inputError: { borderColor: COLORS.error },
  fieldError: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  primaryButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerLink: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
});
