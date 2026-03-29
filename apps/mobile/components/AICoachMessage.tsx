import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography, radii, shadows } from "@habit-coach/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIMessageType = "daily" | "milestone" | "encouragement";

export interface AICoachMessageProps {
  /** The coaching message text */
  message: string;
  /** When this message was generated */
  timestamp: Date;
  /** Message type — controls gradient and icon */
  type: AIMessageType;
  /** Optional coach display name (defaults to "HabitAI Coach") */
  coachName?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today at ${time}`;
  return (
    date.toLocaleDateString([], { month: "short", day: "numeric" }) + ` at ${time}`
  );
}

/** Returns the gradient color pair per message type */
function getGradientColors(type: AIMessageType): [string, string] {
  switch (type) {
    case "daily":
      // Indigo → purple
      return [colors.primary[600], "#7C3AED"];
    case "milestone":
      // Amber → orange
      return [colors.accent[400], "#F97316"];
    case "encouragement":
      // Indigo → emerald
      return [colors.primary[500], "#059669"];
  }
}

function getTypeLabel(type: AIMessageType): string {
  switch (type) {
    case "daily":         return "Daily Coach";
    case "milestone":     return "Milestone";
    case "encouragement": return "Coach";
  }
}

function getTypeIcon(type: AIMessageType): string {
  switch (type) {
    case "milestone":     return "✨";
    case "encouragement": return "💪";
    default:              return "🤖";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AICoachMessage (React Native) — chat-bubble style coaching message.
 *
 * Layout:
 *  - Row: coach avatar circle | gradient bubble
 *  - Bubble: type pill (top-right) | coach name | message body | timestamp
 *
 * Gradients per type:
 *  - daily:         indigo → purple (calm, professional)
 *  - milestone:     amber → orange (celebratory)
 *  - encouragement: indigo → emerald (warm)
 *
 * Uses expo-linear-gradient for the bubble background.
 */
export function AICoachMessage({
  message,
  timestamp,
  type,
  coachName = "HabitAI Coach",
}: AICoachMessageProps) {
  const gradientColors = getGradientColors(type);
  const typeLabel = getTypeLabel(type);
  const typeIcon = getTypeIcon(type);

  return (
    <View
      style={styles.wrapper}
      accessibilityRole="text"
      accessibilityLabel={`${coachName}: ${message}`}
    >
      {/* Coach avatar */}
      <View style={styles.avatar} accessibilityElementsHidden>
        <Text style={styles.avatarIcon} allowFontScaling={false}>
          {typeIcon}
        </Text>
      </View>

      {/* Bubble */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bubble}
      >
        {/* Type pill — top right */}
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>{typeLabel}</Text>
        </View>

        {/* Coach name */}
        <Text style={styles.coachName} numberOfLines={1}>
          {coachName}
        </Text>

        {/* Message body */}
        <Text style={styles.messageText}>{message}</Text>

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          <Text>{formatDate(timestamp)}</Text>
        </Text>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
  },

  // Coach avatar circle
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.bg.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...shadows.sm,
  },
  avatarIcon: {
    fontSize: 18,
  },

  // Gradient bubble
  bubble: {
    flex: 1,
    maxWidth: 320,
    borderRadius: radii["2xl"],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    ...shadows.md,
  },

  // Type badge pill
  typePill: {
    position: "absolute",
    top: spacing[3],
    right: spacing[3],
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radii.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  typePillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: "rgba(255,255,255,0.9)",
  },

  // Coach name
  coachName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: "rgba(255,255,255,0.75)",
    marginBottom: spacing[1],
    paddingRight: spacing[16], // make room for type pill
  },

  // Message body
  messageText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.white,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // Timestamp
  timestamp: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xs,
    color: "rgba(255,255,255,0.6)",
    textAlign: "right",
  },
});

export default AICoachMessage;
