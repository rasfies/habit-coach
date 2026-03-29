import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { cancelAllReminders } from "@/lib/notifications";

const COLORS = {
  primary: "#4F46E5",
  accent: "#FBBF24",
  error: "#EF4444",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  notification_enabled: boolean;
  reminder_time?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.users.getMe();
      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        setDisplayName(data.display_name);
        setReminderTime(data.reminder_time ?? "");
        setNotificationsEnabled(data.notification_enabled ?? true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSaveProfile() {
    if (!displayName.trim() || displayName.trim().length < 2) {
      Alert.alert("Invalid name", "Display name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.users.updateMe({
        display_name: displayName.trim(),
        reminder_time: reminderTime || null,
        notification_enabled: notificationsEnabled,
      });
      if (res.ok) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Saved", "Your profile has been updated.");
        loadProfile();
      } else {
        Alert.alert("Error", "Could not save profile. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleNotifications(value: boolean) {
    setNotificationsEnabled(value);
    try {
      await api.notifications.updatePreferences({
        notification_enabled: value,
        reminder_time: reminderTime || null,
      });
      if (!value) {
        await cancelAllReminders();
      }
    } catch {
      // Revert on failure
      setNotificationsEnabled(!value);
    }
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library to change your avatar."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setAvatarLoading(true);
    try {
      const res = await api.users.uploadAvatar(result.assets[0].uri);
      if (res.ok) {
        const { avatar_url } = await res.json();
        setProfile((prev) => (prev ? { ...prev, avatar_url } : prev));
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else {
        Alert.alert("Upload failed", "Could not upload avatar. Try a smaller image.");
      }
    } catch {
      Alert.alert("Upload failed", "Could not upload avatar.");
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await api.auth.logout();
            await supabase.auth.signOut();
            await cancelAllReminders();
            router.replace("/(auth)/login");
          } catch {
            // Force sign out even if API call fails
            await supabase.auth.signOut();
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            // In MVP: sign out and show a message — full deletion would be a backend endpoint
            await supabase.auth.signOut();
            Alert.alert(
              "Request submitted",
              "Your account deletion request has been submitted. Contact support@habitai.app to confirm."
            );
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 80 }} />
      </View>
    );
  }

  const initials = profile?.display_name
    ?.split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickAvatar}
            disabled={avatarLoading}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {avatarLoading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditIcon}>✏️</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Profile card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyText}>{profile?.email ?? "—"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Notifications card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Habit Reminders</Text>
              <Text style={styles.toggleDesc}>Daily reminders to complete your habits</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Default Reminder Time</Text>
            <TextInput
              style={styles.input}
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="HH:MM (e.g. 08:00)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.fieldHint}>
              Per-habit reminder times override this default.
            </Text>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>

          <TouchableOpacity style={styles.dangerRow} onPress={handleLogout}>
            <Text style={styles.dangerRowIcon}>👋</Text>
            <Text style={styles.dangerRowText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount}>
            <Text style={styles.dangerRowIcon}>🗑️</Text>
            <Text style={[styles.dangerRowText, styles.deleteText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <Text style={styles.appVersion}>HabitAI v1.0 · Build habits. Together.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 30, color: COLORS.primary, lineHeight: 34 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  headerSpacer: { width: 40 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: COLORS.primary },
  avatarOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarEditIcon: { fontSize: 12 },
  avatarHint: { fontSize: 12, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  fieldHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  readonlyField: {
    height: 44,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
  },
  readonlyText: { fontSize: 15, color: COLORS.textSecondary },
  saveButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: "500", color: COLORS.textPrimary },
  toggleDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  dangerRowIcon: { fontSize: 20 },
  dangerRowText: { fontSize: 15, fontWeight: "500", color: COLORS.textPrimary },
  deleteText: { color: COLORS.error },
  appVersion: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
});
