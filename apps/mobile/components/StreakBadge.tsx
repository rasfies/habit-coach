import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography, radii } from "@habit-coach/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreakBadgeProps {
  /** Current consecutive day streak count */
  count: number;
  /** Whether this count is a notable milestone (3, 7, 14, 30+ days) */
  milestone?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMilestoneLabel(count: number): string | null {
  if (count >= 365) return "1 year!";
  if (count >= 100) return "100 days!";
  if (count >= 30)  return "30 days!";
  if (count >= 14)  return "2 weeks!";
  if (count >= 7)   return "1 week!";
  if (count >= 3)   return "3 days!";
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * StreakBadge (React Native) — flame emoji + streak count pill.
 *
 * Styling tiers:
 *  - count === 0:   Neutral gray — no active streak
 *  - count > 0:     Amber/yellow tint — active streak
 *  - milestone:     Solid amber-400 fill, white text
 *
 * Uses monospace font for the number (JetBrains Mono or system mono fallback).
 */
export function StreakBadge({ count, milestone = false }: StreakBadgeProps) {
  const isActive = count > 0;
  const milestoneLabel = milestone ? getMilestoneLabel(count) : null;

  return (
    <View
      style={[
        styles.badge,
        !isActive && styles.badgeInactive,
        isActive && !milestone && styles.badgeActive,
        milestone && styles.badgeMilestone,
      ]}
      accessibilityLabel={`${count} day streak${milestone ? ", milestone!" : ""}`}
    >
      {/* Flame icon */}
      <Text
        style={[
          styles.flame,
          !isActive && styles.flameInactive,
        ]}
        allowFontScaling={false}
      >
        🔥
      </Text>

      {/* Streak number — monospace */}
      <Text
        style={[
          styles.count,
          !isActive && styles.countInactive,
          isActive && !milestone && styles.countActive,
          milestone && styles.countMilestone,
        ]}
        allowFontScaling={false}
      >
        {count}
      </Text>

      {/* Milestone label */}
      {milestoneLabel ? (
        <Text style={[styles.milestoneLabel, milestone && styles.milestoneLabelActive]}>
          {milestoneLabel}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    gap: 3,
  },

  // Color variants
  badgeInactive: {
    backgroundColor: colors.neutral[100],
  },
  badgeActive: {
    backgroundColor: colors.accent[100],
  },
  badgeMilestone: {
    backgroundColor: colors.accent[400],
    // React Native shadow for glow effect
    shadowColor: colors.accent[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },

  // Flame icon
  flame: {
    fontSize: 14,
  },
  flameInactive: {
    opacity: 0.35,
  },

  // Count number
  count: {
    fontFamily: "JetBrains Mono",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
  countInactive: {
    color: colors.neutral[500],
  },
  countActive: {
    color: colors.accent[700],
  },
  countMilestone: {
    color: colors.white,
  },

  // Milestone label text
  milestoneLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: 2,
  },
  milestoneLabelActive: {
    color: colors.white,
    opacity: 0.9,
  },
});

export default StreakBadge;
