import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { HabitCard } from "@/components/HabitCard";
import { AICoachMessage } from "@/components/AICoachMessage";
import { ProgressRing } from "@/components/ProgressRing";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const COLORS = {
  primary: "#4F46E5",
  accent: "#FBBF24",
  success: "#22C55E",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};

interface HabitItem {
  id: string;
  name: string;
  icon: string;
  current_streak: number;
  completed_today: boolean;
  description?: string;
}

interface CoachMessage {
  id: string;
  content: string;
  message_type: string;
  created_at: string;
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name} ☀️`;
  if (hour < 17) return `Good afternoon, ${name} 👋`;
  return `Good evening, ${name} 🌙`;
}

function messageTypeToVariant(type: string): "daily" | "milestone" | "encouragement" {
  if (type === "streak_3" || type === "streak_7") return "milestone";
  if (type === "day1_welcome") return "encouragement";
  return "daily";
}

export default function DashboardTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [coachMessage, setCoachMessage] = useState<CoachMessage | null>(null);
  const [userName, setUserName] = useState("there");
  const [bestStreak, setBestStreak] = useState(0);
  const [thisWeekRate, setThisWeekRate] = useState(0);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set());

  const loadDashboard = useCallback(async () => {
    try {
      const [habitsRes, coachRes, meRes, summaryRes] = await Promise.all([
        api.habits.list(),
        api.coaching.getToday(),
        api.users.getMe(),
        api.analytics.getSummary(),
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        setUserName(me.display_name?.split(" ")[0] ?? "there");
      }

      if (habitsRes.ok) {
        const { habits: h } = await habitsRes.json();
        setHabits(h ?? []);
      }

      if (coachRes.ok) {
        const msg = await coachRes.json();
        if (msg.content) setCoachMessage(msg);
      }

      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        setBestStreak(summary.best_current_streak?.current_streak ?? 0);
        setThisWeekRate(Math.round(summary.this_week_completion_rate ?? 0));
      }
    } catch {
      // Silently fail — show whatever loaded
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
  }, [loadDashboard]);

  async function handleToggleCheck(habitId: string) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || habit.completed_today || optimisticUpdates.has(habitId)) return;

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? { ...h, completed_today: true, current_streak: h.current_streak + 1 }
          : h
      )
    );
    setOptimisticUpdates((prev) => new Set(prev).add(habitId));

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const res = await api.habits.logToday(habitId);
      if (res.ok) {
        const data = await res.json();
        // Handle milestone
        if (data.streak_milestone && Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        // Refresh habits with real data
        const habitsRes = await api.habits.list();
        if (habitsRes.ok) {
          const { habits: h } = await habitsRes.json();
          setHabits(h ?? []);
        }
      } else {
        // Revert optimistic update
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? { ...h, completed_today: false, current_streak: Math.max(0, h.current_streak - 1) }
              : h
          )
        );
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch {
      // Revert on network error
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, completed_today: false, current_streak: Math.max(0, h.current_streak - 1) }
            : h
        )
      );
    } finally {
      setOptimisticUpdates((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  }

  const completedCount = habits.filter((h) => h.completed_today).length;
  const totalCount = habits.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) return <LoadingSpinner message="Loading your habits…" />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 16 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting(userName)}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Progress ring + quick stats */}
      <View style={styles.statsRow}>
        <View style={styles.ringWrapper}>
          <ProgressRing percent={completionPercent} size={120} />
          <Text style={styles.ringLabel}>
            {completedCount}/{totalCount} done
          </Text>
        </View>
        <View style={styles.statsCards}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Best streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{thisWeekRate}%</Text>
            <Text style={styles.statLabel}>This week</Text>
          </View>
        </View>
      </View>

      {/* AI Coach message */}
      {coachMessage && (
        <View style={styles.coachSection}>
          <AICoachMessage
            message={coachMessage.content}
            timestamp={new Date(coachMessage.created_at)}
            type={messageTypeToVariant(coachMessage.message_type)}
          />
        </View>
      )}

      {/* Habits section */}
      <Text style={styles.sectionTitle}>Today's Habits</Text>

      {habits.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No habits yet"
          subtitle="Add your first habit to start tracking your progress and get AI coaching."
          ctaLabel="Add a Habit"
          onCta={() => router.push("/(tabs)/habits")}
        />
      ) : (
        habits.map((habit) => (
          <HabitCard
            key={habit.id}
            id={habit.id}
            name={habit.name}
            icon={habit.icon || "🎯"}
            description={habit.description}
            streakCount={habit.current_streak}
            checkedToday={habit.completed_today}
            onToggleCheck={handleToggleCheck}
            disabled={optimisticUpdates.has(habit.id)}
          />
        ))
      )}

      {/* Bottom padding for tab bar */}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 80 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { fontSize: 22 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  ringWrapper: { alignItems: "center", gap: 8 },
  ringLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  statsCards: { flex: 1, gap: 10 },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontFamily: "JetBrainsMono-Bold",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  coachSection: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 4,
    marginTop: 8,
  },
});
