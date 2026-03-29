import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { StreakBadge } from "./StreakBadge";
import { DayDot, DayDotStatus } from "./DayDot";

export interface GroupMemberRowProps {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  currentStreak: number;
  /** Last 7 days status array (oldest → newest) */
  last7Days: DayDotStatus[];
  isCurrentUser?: boolean;
}

const MILESTONE_COUNTS = new Set([3, 7, 14, 21, 30, 60, 90, 100]);

export function GroupMemberRow({
  displayName,
  avatarUrl,
  currentStreak,
  last7Days,
  isCurrentUser = false,
}: GroupMemberRowProps) {
  const isMilestone = MILESTONE_COUNTS.has(currentStreak) && currentStreak > 0;
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlighted]}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Name + dots */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
            {isCurrentUser && <Text style={styles.youBadge}> (you)</Text>}
          </Text>
          <StreakBadge count={currentStreak} milestone={isMilestone} />
        </View>
        <View style={styles.dotsRow}>
          {last7Days.map((status, i) => (
            <View key={i} style={styles.dotWrapper}>
              <DayDot status={status} size={12} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  rowHighlighted: {
    backgroundColor: "#EEF2FF",
  },
  avatarWrapper: {
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  youBadge: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 4,
  },
  dotWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default GroupMemberRow;
