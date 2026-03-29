import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { HabitCard } from "@/components/HabitCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api } from "@/lib/api";

const COLORS = {
  primary: "#4F46E5",
  accent: "#FBBF24",
  success: "#22C55E",
  error: "#EF4444",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};

const EMOJI_OPTIONS = [
  "🏃", "💪", "📚", "🧘", "💧", "🍎", "😴", "✍️",
  "🎯", "🎸", "🧹", "🌅", "🧠", "🏋️", "🚴", "🥗",
  "🎨", "🙏", "💊", "🐕", "🌱", "📝", "🎵", "🤸",
  "🏊", "🧗", "⚽", "🎾", "♟️", "🖥️", "🌿", "🧺",
];

interface HabitItem {
  id: string;
  name: string;
  icon: string;
  current_streak: number;
  completed_today: boolean;
  reminder_time?: string;
  sort_order: number;
}

export default function HabitsTab() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habits, setHabits] = useState<HabitItem[]>([]);

  // Add/edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [habitName, setHabitName] = useState("");
  const [habitIcon, setHabitIcon] = useState("🎯");
  const [habitReminder, setHabitReminder] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const loadHabits = useCallback(async () => {
    try {
      const res = await api.habits.list();
      if (res.ok) {
        const { habits: h } = await res.json();
        setHabits((h ?? []).sort((a: HabitItem, b: HabitItem) => a.sort_order - b.sort_order));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHabits();
  };

  function openAddModal() {
    setEditingHabit(null);
    setHabitName("");
    setHabitIcon("🎯");
    setHabitReminder("");
    setShowModal(true);
  }

  function openEditModal(habit: HabitItem) {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitIcon(habit.icon || "🎯");
    setHabitReminder(habit.reminder_time ?? "");
    setShowModal(true);
  }

  async function handleSaveHabit() {
    if (!habitName.trim()) return;
    setModalLoading(true);
    try {
      if (editingHabit) {
        const res = await api.habits.update(editingHabit.id, {
          name: habitName.trim(),
          icon: habitIcon,
          reminder_time: habitReminder || undefined,
        });
        if (res.ok) {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowModal(false);
          loadHabits();
        } else {
          const body = await res.json();
          if (res.status === 422 && body.error === "HABIT_LIMIT_REACHED") {
            Alert.alert("Limit reached", "You can have a maximum of 10 active habits.");
          }
        }
      } else {
        const res = await api.habits.create({
          name: habitName.trim(),
          icon: habitIcon,
          frequency: "daily",
          reminder_time: habitReminder || undefined,
        });
        if (res.ok) {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowModal(false);
          loadHabits();
        } else {
          const body = await res.json();
          if (res.status === 422 && body.error === "HABIT_LIMIT_REACHED") {
            Alert.alert("Limit reached", "You can have a maximum of 10 active habits.");
          }
        }
      }
    } catch {
      Alert.alert("Error", "Could not save habit. Please try again.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDeleteHabit(habitId: string) {
    Alert.alert(
      "Delete Habit",
      "Are you sure? Your streak history will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.habits.remove(habitId);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              loadHabits();
            } catch {
              Alert.alert("Error", "Could not delete habit.");
            }
          },
        },
      ]
    );
  }

  async function handleToggleCheck(habitId: string) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || habit.completed_today) return;

    // Optimistic
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? { ...h, completed_today: true, current_streak: h.current_streak + 1 }
          : h
      )
    );

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const res = await api.habits.logToday(habitId);
      if (res.ok) {
        const data = await res.json();
        if (data.streak_milestone && Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        loadHabits();
      } else {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? { ...h, completed_today: false, current_streak: Math.max(0, h.current_streak - 1) }
              : h
          )
        );
      }
    } catch {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, completed_today: false, current_streak: Math.max(0, h.current_streak - 1) }
            : h
        )
      );
    }
  }

  if (loading) return <LoadingSpinner message="Loading habits…" />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Habits</Text>
        <Text style={styles.headerCount}>{habits.length}/10</Text>
      </View>

      {habits.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No habits yet"
          subtitle="Build your first daily habit. Your AI coach will tailor messages to your specific habits."
          ctaLabel="Add First Habit"
          onCta={openAddModal}
        />
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <HabitCard
                id={item.id}
                name={item.name}
                icon={item.icon || "🎯"}
                streakCount={item.current_streak}
                checkedToday={item.completed_today}
                onToggleCheck={handleToggleCheck}
              />
              {/* Edit / Delete row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteHabit(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, habits.length >= 10 && styles.fabDisabled]}
        onPress={habits.length < 10 ? openAddModal : undefined}
        activeOpacity={0.85}
        accessibilityLabel="Add habit"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingHabit ? "Edit Habit" : "New Habit"}
            </Text>

            {/* Emoji + Name row */}
            <View style={styles.habitFormRow}>
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Text style={styles.emojiButtonText}>{habitIcon}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.nameInput}
                placeholder="Habit name"
                placeholderTextColor="#9CA3AF"
                value={habitName}
                onChangeText={setHabitName}
                autoCapitalize="words"
                autoFocus={!editingHabit}
                returnKeyType="done"
              />
            </View>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.emojiScroll}
              >
                {EMOJI_OPTIONS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    onPress={() => {
                      setHabitIcon(em);
                      setShowEmojiPicker(false);
                    }}
                    style={[
                      styles.emojiOption,
                      habitIcon === em && styles.emojiOptionSelected,
                    ]}
                  >
                    <Text style={styles.emojiOptionText}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Reminder time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Reminder time (optional)</Text>
              <TextInput
                style={styles.reminderInput}
                placeholder="HH:MM (e.g. 07:30)"
                placeholderTextColor="#9CA3AF"
                value={habitReminder}
                onChangeText={setHabitReminder}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!habitName.trim() || modalLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSaveHabit}
              disabled={!habitName.trim() || modalLoading}
            >
              {modalLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingHabit ? "Save Changes" : "Add Habit"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary },
  headerCount: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "500" },
  listContent: { paddingBottom: 100 },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
    marginTop: -4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  deleteButton: { borderColor: "#FECACA" },
  deleteButtonText: { fontSize: 12, color: COLORS.error, fontWeight: "500" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabDisabled: { backgroundColor: "#9CA3AF" },
  fabText: { fontSize: 28, color: "#fff", fontWeight: "300", lineHeight: 32 },
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
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 16 },
  habitFormRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiButtonText: { fontSize: 24 },
  nameInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  emojiScroll: { marginBottom: 16 },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: COLORS.textSecondary, marginBottom: 6 },
  reminderInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  saveButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.5 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelButton: { paddingVertical: 12, alignItems: "center" },
  cancelButtonText: { fontSize: 15, color: COLORS.textSecondary },
});
