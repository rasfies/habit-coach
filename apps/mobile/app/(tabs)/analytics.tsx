import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart, LineChart } from "react-native-chart-kit";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 40;

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

const CHART_CONFIG = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
  labelColor: () => COLORS.textSecondary,
  style: { borderRadius: 12 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.primary },
};

interface HabitAnalytics {
  habit_id: string;
  habit_name: string;
  completion_rate: number;
  days_completed: number;
  days_possible: number;
  streak_at_end: number;
}

interface WeeklyData {
  period_start: string;
  period_end: string;
  overall_completion_rate: number;
  habits: HabitAnalytics[];
}

interface MonthlyData {
  period_start: string;
  period_end: string;
  overall_completion_rate: number;
  habits: HabitAnalytics[];
}

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsTab() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [summary, setSummary] = useState<{
    best_current_streak?: { habit_name: string; current_streak: number };
    all_time_best_streak?: { habit_name: string; longest_streak: number };
    total_completions_all_time?: number;
    this_week_completion_rate?: number;
    this_month_completion_rate?: number;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [weekRes, monthRes, summaryRes] = await Promise.all([
        api.analytics.getWeekly(),
        api.analytics.getMonthly(),
        api.analytics.getSummary(),
      ]);
      if (weekRes.ok) setWeeklyData(await weekRes.json());
      if (monthRes.ok) setMonthlyData(await monthRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  function buildWeeklyBarData() {
    if (!weeklyData?.habits?.length) {
      return { labels: DAYS_SHORT, datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] };
    }

    // Aggregate all habits' daily breakdown into completion rates by day
    const dayTotals = Array(7).fill(0);
    const dayHabits = Array(7).fill(0);

    weeklyData.habits.forEach((habit) => {
      const breakdown = (habit as unknown as {
        daily_breakdown?: Array<{ date: string; completed: boolean }>;
      }).daily_breakdown ?? [];
      breakdown.forEach((day, i) => {
        if (i < 7) {
          dayTotals[i] += day.completed ? 1 : 0;
          dayHabits[i] += 1;
        }
      });
    });

    const data = dayTotals.map((total, i) =>
      dayHabits[i] > 0 ? Math.round((total / dayHabits[i]) * 100) : 0
    );

    return { labels: DAYS_SHORT, datasets: [{ data }] };
  }

  function buildMonthlyLineData() {
    if (!monthlyData?.habits?.length) {
      return {
        labels: ["W1", "W2", "W3", "W4"],
        datasets: [{ data: [0, 0, 0, 0] }],
      };
    }

    // Build week-by-week average
    const allWeeklyBreakdowns: Array<number[]> = [];
    monthlyData.habits.forEach((habit) => {
      const weekly = (habit as unknown as {
        weekly_breakdown?: Array<{ completion_rate: number }>;
      }).weekly_breakdown ?? [];
      weekly.forEach((w, i) => {
        if (!allWeeklyBreakdowns[i]) allWeeklyBreakdowns[i] = [];
        allWeeklyBreakdowns[i].push(w.completion_rate);
      });
    });

    const data = allWeeklyBreakdowns.map((rates) =>
      rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0
    );

    const labels = data.map((_, i) => `W${i + 1}`);
    return { labels, datasets: [{ data: data.length > 0 ? data : [0] }] };
  }

  if (loading) return <LoadingSpinner message="Loading analytics…" />;

  const currentData = activeTab === "week" ? weeklyData : monthlyData;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.headerTitle}>Analytics</Text>

      {/* Segmented control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === "week" && styles.segmentActive]}
          onPress={() => setActiveTab("week")}
        >
          <Text
            style={[styles.segmentText, activeTab === "week" && styles.segmentTextActive]}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === "month" && styles.segmentActive]}
          onPress={() => setActiveTab("month")}
        >
          <Text
            style={[styles.segmentText, activeTab === "month" && styles.segmentTextActive]}
          >
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {Math.round(currentData?.overall_completion_rate ?? 0)}%
          </Text>
          <Text style={styles.summaryLabel}>Completion</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {summary?.best_current_streak?.current_streak ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>Best Streak</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {summary?.total_completions_all_time ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>All-time</Text>
        </View>
      </View>

      {/* Bar chart */}
      {activeTab === "week" && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Completion Rate (%)</Text>
          <BarChart
            data={buildWeeklyBarData()}
            width={CHART_WIDTH}
            height={180}
            chartConfig={CHART_CONFIG}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            yAxisSuffix="%"
            yAxisLabel=""
          />
        </View>
      )}

      {/* Line chart */}
      {activeTab === "month" && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Completion Trend (%)</Text>
          <LineChart
            data={buildMonthlyLineData()}
            width={CHART_WIDTH}
            height={180}
            chartConfig={CHART_CONFIG}
            style={styles.chart}
            bezier
            fromZero
            yAxisSuffix="%"
            yAxisLabel=""
          />
        </View>
      )}

      {/* Per-habit breakdown */}
      {currentData?.habits?.length ? (
        <View style={styles.habitBreakdownSection}>
          <Text style={styles.sectionTitle}>Habit Breakdown</Text>
          {currentData.habits.map((habit) => (
            <View key={habit.habit_id} style={styles.habitStatCard}>
              <View style={styles.habitStatHeader}>
                <Text style={styles.habitStatName} numberOfLines={1}>
                  {habit.habit_name}
                </Text>
                <Text style={styles.habitStatRate}>
                  {Math.round(habit.completion_rate)}%
                </Text>
              </View>
              {/* Progress bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, habit.completion_rate)}%`,
                      backgroundColor:
                        habit.completion_rate >= 80
                          ? COLORS.success
                          : habit.completion_rate >= 50
                          ? COLORS.accent
                          : COLORS.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.habitStatMeta}>
                {habit.days_completed}/{habit.days_possible} days · Streak:{" "}
                {habit.streak_at_end}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyChartBox}>
          <Text style={styles.emptyChartText}>
            No habit data for this period yet. Complete some habits to see analytics!
          </Text>
        </View>
      )}

      {/* All-time best streak callout */}
      {summary?.all_time_best_streak && (
        <View style={styles.bestStreakCard}>
          <Text style={styles.bestStreakEmoji}>🏆</Text>
          <View style={styles.bestStreakInfo}>
            <Text style={styles.bestStreakTitle}>All-Time Best Streak</Text>
            <Text style={styles.bestStreakValue}>
              {summary.all_time_best_streak.longest_streak} days —{" "}
              {summary.all_time_best_streak.habit_name}
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 80 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: 14, fontWeight: "500", color: COLORS.textSecondary },
  segmentTextActive: { color: "#fff", fontWeight: "600" },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryValue: {
    fontFamily: "JetBrainsMono-Bold",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 12 },
  chart: { borderRadius: 10, marginLeft: -16 },
  habitBreakdownSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 12 },
  habitStatCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  habitStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  habitStatName: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, flex: 1 },
  habitStatRate: {
    fontFamily: "JetBrainsMono-Bold",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  habitStatMeta: { fontSize: 12, color: COLORS.textSecondary },
  emptyChartBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  emptyChartText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  bestStreakCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 12,
    marginBottom: 8,
  },
  bestStreakEmoji: { fontSize: 28 },
  bestStreakInfo: { flex: 1 },
  bestStreakTitle: { fontSize: 12, fontWeight: "600", color: "#B45309" },
  bestStreakValue: { fontSize: 15, fontWeight: "700", color: "#92400E", marginTop: 2 },
});
