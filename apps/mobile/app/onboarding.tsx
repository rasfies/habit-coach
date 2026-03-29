import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_STEPS = 4;

const COLORS = {
  primary: "#4F46E5",
  accent: "#FBBF24",
  success: "#22C55E",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  error: "#EF4444",
};

// Emoji options for habit picker
const EMOJI_OPTIONS = [
  "🏃", "💪", "📚", "🧘", "💧", "🍎", "😴", "✍️",
  "🎯", "🎸", "🧹", "🌅", "🧠", "🏋️", "🚴", "🥗",
  "🎨", "🙏", "💊", "🐕", "🌱", "📝", "🎵", "🤸",
];

interface HabitDraft {
  name: string;
  icon: string;
  reminder_time?: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Step 2 — Habits
  const [habits, setHabits] = useState<HabitDraft[]>([
    { name: "", icon: "🎯" },
  ]);
  const [habitLoading, setHabitLoading] = useState(false);

  // Step 3 — Groups
  const [groupModalType, setGroupModalType] = useState<"create" | "join" | null>(null);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [joinedGroupName, setJoinedGroupName] = useState<string | null>(null);

  // Step 4 — AI message
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  function animateToStep(nextStep: number) {
    // Slide out current, slide in next
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: nextStep / (TOTAL_STEPS - 1),
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    setStep(nextStep);
  }

  // -------------------------------------------------------------------------
  // Step 2 helpers
  // -------------------------------------------------------------------------

  function addHabit() {
    if (habits.length >= 3) return;
    setHabits([...habits, { name: "", icon: "🎯" }]);
  }

  function updateHabit(index: number, field: keyof HabitDraft, value: string) {
    const updated = habits.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    );
    setHabits(updated);
  }

  async function saveHabitsAndContinue() {
    const validHabits = habits.filter((h) => h.name.trim().length > 0);
    if (validHabits.length === 0) {
      Alert.alert("Add a habit", "Please add at least one habit to continue.");
      return;
    }

    setHabitLoading(true);
    try {
      for (const habit of validHabits) {
        await api.habits.create({
          name: habit.name.trim(),
          icon: habit.icon,
          frequency: "daily",
          ...(habit.reminder_time ? { reminder_time: habit.reminder_time } : {}),
        });
      }
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      animateToStep(2);
    } catch {
      Alert.alert("Error", "Could not save habits. Please try again.");
    } finally {
      setHabitLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3 helpers
  // -------------------------------------------------------------------------

  async function handleCreateGroup() {
    if (!groupName.trim()) return;
    setGroupLoading(true);
    try {
      const res = await api.groups.create(groupName.trim());
      if (res.ok) {
        const data = await res.json();
        setJoinedGroupName(data.name);
        setGroupModalType(null);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch {
      Alert.alert("Error", "Could not create group. Please try again.");
    } finally {
      setGroupLoading(false);
    }
  }

  async function handleJoinGroup() {
    if (!inviteCode.trim()) return;
    setGroupLoading(true);
    try {
      const res = await api.groups.join(inviteCode.trim().toUpperCase());
      if (res.ok) {
        const data = await res.json();
        setJoinedGroupName(data.group_name);
        setGroupModalType(null);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        Alert.alert("Invalid code", "That invite code doesn't exist. Check with your group.");
      }
    } catch {
      Alert.alert("Error", "Could not join group. Please try again.");
    } finally {
      setGroupLoading(false);
    }
  }

  async function finishOnboardingStep3() {
    // Complete onboarding and generate AI message
    try {
      await api.users.completeOnboarding();
    } catch {
      // non-fatal
    }
    animateToStep(3);
    loadAiMessage();
  }

  // -------------------------------------------------------------------------
  // Step 4 helpers
  // -------------------------------------------------------------------------

  async function loadAiMessage() {
    setAiLoading(true);
    try {
      // Trigger day1 message generation
      await api.coaching.generate({ message_type: "day1_welcome" });

      // Poll for the message (up to ~15s)
      let attempts = 0;
      while (attempts < 5) {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await api.coaching.getToday();
        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            setAiMessage(data.content);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return;
          }
        }
        attempts++;
      }
      setAiMessage(
        "Welcome to HabitAI! Your personalized coaching message is being prepared. Check back shortly!"
      );
    } catch {
      setAiMessage(
        "Welcome! Your AI coach is getting ready. You'll see your first personalized message on the dashboard."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function handleLetsGo() {
    router.replace("/(tabs)");
  }

  // -------------------------------------------------------------------------
  // Progress bar
  // -------------------------------------------------------------------------

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // -------------------------------------------------------------------------
  // Render steps
  // -------------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <Animated.View
        style={[styles.content, { transform: [{ translateY: slideAnim }] }]}
      >
        {step === 0 && <StepWelcome onNext={() => animateToStep(1)} />}
        {step === 1 && (
          <StepHabits
            habits={habits}
            onAddHabit={addHabit}
            onUpdateHabit={updateHabit}
            onContinue={saveHabitsAndContinue}
            loading={habitLoading}
          />
        )}
        {step === 2 && (
          <StepGroups
            joinedGroupName={joinedGroupName}
            onCreateGroup={() => setGroupModalType("create")}
            onJoinGroup={() => setGroupModalType("join")}
            onSkip={finishOnboardingStep3}
            onContinue={finishOnboardingStep3}
          />
        )}
        {step === 3 && (
          <StepAiReady
            aiMessage={aiMessage}
            loading={aiLoading}
            onLetsGo={handleLetsGo}
          />
        )}
      </Animated.View>

      {/* Create group modal */}
      <Modal
        visible={groupModalType === "create"}
        animationType="slide"
        transparent
        onRequestClose={() => setGroupModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create a Group</Text>
            <Text style={styles.modalSubtitle}>
              Invite friends with the code you'll get after creating.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Group name (e.g. Morning Warriors)"
              placeholderTextColor="#9CA3AF"
              value={groupName}
              onChangeText={setGroupName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreateGroup}
            />
            <TouchableOpacity
              style={[styles.primaryButton, (!groupName.trim() || groupLoading) && styles.buttonDisabled]}
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || groupLoading}
            >
              {groupLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Group</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setGroupModalType(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join group modal */}
      <Modal
        visible={groupModalType === "join"}
        animationType="slide"
        transparent
        onRequestClose={() => setGroupModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Join a Group</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-character invite code from your friend.
            </Text>
            <TextInput
              style={[styles.modalInput, styles.codeInput]}
              placeholder="ABCD12"
              placeholderTextColor="#9CA3AF"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleJoinGroup}
            />
            <TouchableOpacity
              style={[styles.primaryButton, (!inviteCode.trim() || groupLoading) && styles.buttonDisabled]}
              onPress={handleJoinGroup}
              disabled={!inviteCode.trim() || groupLoading}
            >
              {groupLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Join Group</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setGroupModalType(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// -------------------------------------------------------------------------
// Step sub-components
// -------------------------------------------------------------------------

function StepWelcome({ onNext }: { onNext: () => void }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Animated.Text
        style={[styles.bigEmoji, { transform: [{ translateY: floatAnim }] }]}
      >
        🔥
      </Animated.Text>
      <Text style={styles.stepTitle}>Welcome to HabitAI</Text>
      <Text style={styles.stepSubtitle}>
        Your personal AI habit coach is here. We'll help you build lasting habits with daily
        personalized coaching and real accountability from people who care.
      </Text>
      <View style={styles.featureList}>
        {[
          { icon: "🤖", text: "AI coaching that knows your habits" },
          { icon: "👥", text: "Accountability groups that keep you honest" },
          { icon: "🛡️", text: "Compassion mode — one grace day per week" },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Get Started →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StepHabits({
  habits,
  onAddHabit,
  onUpdateHabit,
  onContinue,
  loading,
}: {
  habits: HabitDraft[];
  onAddHabit: () => void;
  onUpdateHabit: (i: number, f: keyof HabitDraft, v: string) => void;
  onContinue: () => void;
  loading: boolean;
}) {
  const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepEmoji}>📋</Text>
      <Text style={styles.stepTitle}>Build your habit list</Text>
      <Text style={styles.stepSubtitle}>
        What habits do you want to build? Start with 1–3 daily habits.
      </Text>

      {habits.map((habit, i) => (
        <View key={i} style={styles.habitFormCard}>
          <View style={styles.habitFormRow}>
            {/* Emoji picker trigger */}
            <TouchableOpacity
              style={styles.emojiButton}
              onPress={() => setEmojiPickerIndex(emojiPickerIndex === i ? null : i)}
            >
              <Text style={styles.emojiButtonText}>{habit.icon}</Text>
            </TouchableOpacity>
            {/* Name input */}
            <TextInput
              style={styles.habitNameInput}
              placeholder={`Habit ${i + 1} (e.g. Morning run)`}
              placeholderTextColor="#9CA3AF"
              value={habit.name}
              onChangeText={(v) => onUpdateHabit(i, "name", v)}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          {/* Emoji picker */}
          {emojiPickerIndex === i && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.emojiScroll}
            >
              {EMOJI_OPTIONS.map((em) => (
                <TouchableOpacity
                  key={em}
                  onPress={() => {
                    onUpdateHabit(i, "icon", em);
                    setEmojiPickerIndex(null);
                  }}
                  style={[
                    styles.emojiOption,
                    habit.icon === em && styles.emojiOptionSelected,
                  ]}
                >
                  <Text style={styles.emojiOptionText}>{em}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      ))}

      {habits.length < 3 && (
        <TouchableOpacity style={styles.addHabitButton} onPress={onAddHabit}>
          <Text style={styles.addHabitButtonText}>+ Add another habit</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={onContinue}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Save & Continue →</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function StepGroups({
  joinedGroupName,
  onCreateGroup,
  onJoinGroup,
  onSkip,
  onContinue,
}: {
  joinedGroupName: string | null;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepEmoji}>👥</Text>
      <Text style={styles.stepTitle}>Accountability works better together</Text>
      <Text style={styles.stepSubtitle}>
        Join or create a group to share your streak progress with people who'll notice when you
        slip — and cheer you on when you don't.
      </Text>

      {joinedGroupName ? (
        <View style={styles.joinedBox}>
          <Text style={styles.joinedEmoji}>🎉</Text>
          <Text style={styles.joinedText}>You're in!</Text>
          <Text style={styles.joinedGroupName}>{joinedGroupName}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onContinue} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.groupOptionButton} onPress={onCreateGroup} activeOpacity={0.85}>
            <Text style={styles.groupOptionIcon}>🏠</Text>
            <View style={styles.groupOptionText}>
              <Text style={styles.groupOptionTitle}>Create a group</Text>
              <Text style={styles.groupOptionDesc}>Invite friends with a code</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.groupOptionButton} onPress={onJoinGroup} activeOpacity={0.85}>
            <Text style={styles.groupOptionIcon}>🔗</Text>
            <View style={styles.groupOptionText}>
              <Text style={styles.groupOptionTitle}>Join with invite code</Text>
              <Text style={styles.groupOptionDesc}>Enter a friend's 6-char code</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function StepAiReady({
  aiMessage,
  loading,
  onLetsGo,
}: {
  aiMessage: string | null;
  loading: boolean;
  onLetsGo: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepEmoji}>🤖</Text>
      <Text style={styles.stepTitle}>Your AI coach is ready</Text>
      <Text style={styles.stepSubtitle}>
        Here's your Day 1 message — personalized just for you.
      </Text>

      <View style={styles.aiMessageCard}>
        {loading ? (
          <View style={styles.aiLoadingBox}>
            <ActivityIndicator color="#4F46E5" />
            <Text style={styles.aiLoadingText}>Generating your message…</Text>
          </View>
        ) : (
          <Text style={styles.aiMessageText}>
            {aiMessage ?? "Your personalized coaching message will appear here."}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, styles.letsGoButton]}
        onPress={onLetsGo}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Let's go! 🚀</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// -------------------------------------------------------------------------
// Styles
// -------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
  },
  bigEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  stepEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 34,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  featureList: {
    width: "100%",
    marginBottom: 32,
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIcon: { fontSize: 22 },
  featureText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: "500", flex: 1 },
  primaryButton: {
    width: "100%",
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  letsGoButton: {
    backgroundColor: COLORS.success,
    marginTop: 8,
  },
  // Habit form
  habitFormCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  habitFormRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiButtonText: { fontSize: 22 },
  habitNameInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
  },
  emojiScroll: {
    marginTop: 10,
  },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    backgroundColor: COLORS.background,
  },
  emojiOptionSelected: {
    backgroundColor: "#EEF2FF",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emojiOptionText: { fontSize: 22 },
  addHabitButton: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  addHabitButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  // Group step
  groupOptionButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  groupOptionIcon: { fontSize: 28 },
  groupOptionText: { flex: 1 },
  groupOptionTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  groupOptionDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  skipButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },
  joinedBox: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    gap: 6,
  },
  joinedEmoji: { fontSize: 36 },
  joinedText: { fontSize: 20, fontWeight: "700", color: COLORS.success },
  joinedGroupName: { fontSize: 16, color: COLORS.textPrimary, marginBottom: 12 },
  // AI message card
  aiMessageCard: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiLoadingBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  aiLoadingText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  aiMessageText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 24,
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  codeInput: {
    letterSpacing: 4,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
