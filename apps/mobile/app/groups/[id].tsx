import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { GroupMemberRow } from "@/components/GroupMemberRow";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { DayDotStatus } from "@/components/DayDot";

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

interface HabitInfo {
  habit_id: string;
  habit_name: string;
  current_streak: number;
  completed_today: boolean;
}

interface MemberStreak {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  habits: HabitInfo[];
}

interface GroupDetail {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  created_by: string;
}

function buildLast7Days(habits: HabitInfo[]): DayDotStatus[] {
  // Build a rough 7-dot row from completed_today and streak data
  // In a real app this would use habit_logs per day; here we approximate
  const maxStreak = Math.max(...habits.map((h) => h.current_streak), 0);
  const completedToday = habits.some((h) => h.completed_today);

  return Array(7)
    .fill(null)
    .map((_, i) => {
      if (i === 6) return completedToday ? "logged" : "today";
      if (i >= 7 - maxStreak) return "logged";
      return "missed";
    }) as DayDotStatus[];
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [memberStreaks, setMemberStreaks] = useState<MemberStreak[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const [detailRes, streaksRes] = await Promise.all([
        api.groups.getDetail(id),
        api.groups.getStreaks(id),
      ]);

      if (detailRes.ok) {
        const data = await detailRes.json();
        setGroup(data);
      } else if (detailRes.status === 403) {
        Alert.alert("Access denied", "You are not a member of this group.");
        router.back();
        return;
      }

      if (streaksRes.ok) {
        const data = await streaksRes.json();
        setMemberStreaks(data.member_streaks ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  async function handleShareInviteCode() {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my HabitAI accountability group "${group.name}"!\nUse invite code: ${group.invite_code}\n\nDownload HabitAI and enter the code when joining a group.`,
        title: `Join ${group.name} on HabitAI`,
      });
    } catch {
      // User cancelled share sheet — silent
    }
  }

  async function handleLeaveGroup() {
    Alert.alert(
      "Leave Group",
      `Are you sure you want to leave "${group?.name}"? Your streak data will be preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.groups.leave(id);
              if (res.ok) {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                router.back();
              } else {
                Alert.alert("Error", "Could not leave group. Please try again.");
              }
            } catch {
              Alert.alert("Error", "Could not leave group. Please try again.");
            }
          },
        },
      ]
    );
  }

  if (loading) return <LoadingSpinner message="Loading group…" />;
  if (!group) return <LoadingSpinner message="Group not found." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.memberCount}>{group.member_count} members</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Invite code card */}
        <View style={styles.inviteCard}>
          <View style={styles.inviteInfo}>
            <Text style={styles.inviteLabel}>Invite Code</Text>
            <Text style={styles.inviteCode}>{group.invite_code}</Text>
            <Text style={styles.inviteHint}>Share this code to invite friends</Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareInviteCode}
            activeOpacity={0.85}
          >
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Members section */}
        <Text style={styles.sectionTitle}>Members & Streaks</Text>

        {memberStreaks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No streak data yet. Complete habits to show progress here!
            </Text>
          </View>
        ) : (
          memberStreaks.map((member) => {
            const totalStreak = member.habits.reduce(
              (sum, h) => sum + h.current_streak,
              0
            );
            const avgStreak = member.habits.length > 0
              ? Math.round(totalStreak / member.habits.length)
              : 0;
            const last7 = buildLast7Days(member.habits);

            return (
              <GroupMemberRow
                key={member.user_id}
                userId={member.user_id}
                displayName={member.display_name}
                avatarUrl={member.avatar_url}
                currentStreak={avgStreak}
                last7Days={last7}
                isCurrentUser={member.user_id === currentUserId}
              />
            );
          })
        )}

        {/* Per-member habits detail */}
        {memberStreaks.map((member) =>
          member.habits.length > 0 ? (
            <View key={`habits-${member.user_id}`} style={styles.memberHabitsCard}>
              <Text style={styles.memberHabitsName}>{member.display_name}'s habits</Text>
              {member.habits.map((habit) => (
                <View key={habit.habit_id} style={styles.habitRow}>
                  <Text style={styles.habitRowName} numberOfLines={1}>
                    {habit.habit_name}
                  </Text>
                  <View style={styles.habitRowRight}>
                    {habit.completed_today && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>✓ Today</Text>
                      </View>
                    )}
                    <Text style={styles.habitStreak}>🔥 {habit.current_streak}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        )}

        {/* Leave group */}
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
          <Text style={styles.leaveButtonText}>Leave Group</Text>
        </TouchableOpacity>

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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 30, color: COLORS.primary, lineHeight: 34 },
  headerCenter: { flex: 1, alignItems: "center" },
  groupName: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  memberCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  headerSpacer: { width: 40 },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    margin: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    gap: 12,
  },
  inviteInfo: { flex: 1 },
  inviteLabel: { fontSize: 11, fontWeight: "600", color: COLORS.primary, marginBottom: 4 },
  inviteCode: {
    fontFamily: "JetBrainsMono-Bold",
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  inviteHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  shareButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  shareButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  emptyBox: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  memberHabitsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberHabitsName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  habitRowName: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  habitRowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  completedBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedBadgeText: { fontSize: 11, color: "#15803D", fontWeight: "600" },
  habitStreak: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  leaveButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF1F2",
  },
  leaveButtonText: { fontSize: 15, color: COLORS.error, fontWeight: "600" },
});
