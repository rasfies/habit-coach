import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { StreakBadge } from "./StreakBadge";
import { colors, spacing, typography, radii, shadows } from "@habit-coach/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HabitCardProps {
  /** Unique habit identifier */
  id: string;
  /** Display name of the habit */
  name: string;
  /** Emoji or icon character representing this habit */
  icon: string;
  /** Short description / cue (optional) */
  description?: string;
  /** Number of consecutive days logged */
  streakCount: number;
  /** Whether the user has already checked in today */
  checkedToday: boolean;
  /** Called when the check button is toggled */
  onToggleCheck: (id: string) => void;
  /** Whether the check button should be disabled (e.g. optimistic update in flight) */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMilestone(count: number): boolean {
  const milestones = new Set([3, 7, 14, 21, 30, 60, 90, 100, 150, 180, 365]);
  return milestones.has(count) || (count > 0 && count % 100 === 0);
}

// ---------------------------------------------------------------------------
// Check button sub-component
// ---------------------------------------------------------------------------

interface CheckButtonProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  habitName: string;
}

function CheckButton({ checked, onToggle, disabled, habitName }: CheckButtonProps) {
  const handlePress = useCallback(async () => {
    if (disabled) return;
    // Haptic feedback — light tap for check, medium for uncheck
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(
        checked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
      );
    }
    onToggle();
  }, [disabled, checked, onToggle]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.checkButton,
        checked ? styles.checkButtonChecked : styles.checkButtonUnchecked,
        disabled && styles.checkButtonDisabled,
      ]}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={checked ? `Uncheck ${habitName}` : `Check in for ${habitName}`}
    >
      {checked && (
        <Text style={styles.checkMark} allowFontScaling={false}>
          ✓
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * HabitCard (React Native) — primary unit of the habits screen.
 *
 * Shows:
 *  - Habit icon circle + name + optional description
 *  - StreakBadge (amber/yellow at milestones)
 *  - CheckButton (56px, solid green when checked)
 *  - Fire emoji at milestone streak counts
 *
 * Uses NativeWind-compatible StyleSheet with design tokens.
 */
export function HabitCard({
  id,
  name,
  icon,
  description,
  streakCount,
  checkedToday,
  onToggleCheck,
  disabled = false,
}: HabitCardProps) {
  const milestone = isMilestone(streakCount);

  return (
    <View
      style={[
        styles.card,
        checkedToday && styles.cardChecked,
        milestone && !checkedToday && styles.cardMilestone,
      ]}
      accessibilityRole="none"
      accessibilityLabel={`${name}, ${streakCount} day streak${checkedToday ? ", checked today" : ""}`}
    >
      {/* Left accent border */}
      <View
        style={[
          styles.accentBorder,
          checkedToday && styles.accentBorderChecked,
          milestone && !checkedToday && styles.accentBorderMilestone,
        ]}
      />

      {/* Content row */}
      <View style={styles.content}>
        {/* Icon circle */}
        <View style={styles.iconCircle} accessibilityElementsHidden>
          <Text style={styles.iconText} allowFontScaling={false}>
            {icon}
          </Text>
        </View>

        {/* Name + description + streak */}
        <View style={styles.textColumn}>
          <View style={styles.nameRow}>
            <Text style={styles.habitName} numberOfLines={1} ellipsizeMode="tail">
              {name}
            </Text>
            {milestone && streakCount > 0 && (
              <Text style={styles.milestoneEmoji} allowFontScaling={false}>
                🔥
              </Text>
            )}
          </View>
          {description ? (
            <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
              {description}
            </Text>
          ) : null}
          <View style={styles.badgeRow}>
            <StreakBadge count={streakCount} milestone={milestone} />
          </View>
        </View>

        {/* Check button */}
        <CheckButton
          checked={checkedToday}
          onToggle={() => onToggleCheck(id)}
          disabled={disabled}
          habitName={name}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: radii.xl,
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    overflow: "hidden",
    ...shadows.md,
  },
  cardChecked: {
    backgroundColor: colors.success[50],
  },
  cardMilestone: {
    backgroundColor: colors.accent[50],
  },

  // Left color accent strip (4px wide)
  accentBorder: {
    width: 4,
    backgroundColor: "transparent",
  },
  accentBorderChecked: {
    backgroundColor: colors.success[500],
  },
  accentBorderMilestone: {
    backgroundColor: colors.accent[400],
  },

  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: 20,
  },

  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  habitName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[800],
    lineHeight: typography.fontSize.base * typography.lineHeight.tight,
    flex: 1,
  },
  milestoneEmoji: {
    fontSize: 16,
  },
  description: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  badgeRow: {
    marginTop: spacing[2],
  },

  // Check button
  checkButton: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkButtonUnchecked: {
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: "transparent",
  },
  checkButtonChecked: {
    borderWidth: 2,
    borderColor: colors.success[500],
    backgroundColor: colors.success[500],
    ...shadows.sm,
  },
  checkButtonDisabled: {
    opacity: 0.4,
  },
  checkMark: {
    fontSize: 22,
    color: colors.white,
    fontWeight: "700",
  },
});

export default HabitCard;
