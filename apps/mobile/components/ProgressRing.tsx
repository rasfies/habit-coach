import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** Completion percentage 0–100 */
  percent: number;
  /** Ring diameter in px (default 120) */
  size?: number;
  /** Ring stroke width (default 8) */
  strokeWidth?: number;
}

const COLORS = {
  track: "#E5E7EB",
  progress: "#4F46E5",
  progressComplete: "#FBBF24",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
};

export function ProgressRing({
  percent,
  size = 120,
  strokeWidth = 8,
}: ProgressRingProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // Animate from 0 to the target dashoffset
  const animatedValue = useRef(new Animated.Value(0)).current;
  const targetOffset = circumference * (1 - clampedPercent / 100);

  useEffect(() => {
    animatedValue.setValue(circumference); // start full offset (empty ring)
    Animated.timing(animatedValue, {
      toValue: targetOffset,
      duration: 600,
      useNativeDriver: false, // SVG props can't use native driver
    }).start();
  }, [clampedPercent]); // eslint-disable-line react-hooks/exhaustive-deps

  const isComplete = clampedPercent >= 100;
  const strokeColor = isComplete ? COLORS.progressComplete : COLORS.progress;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track circle */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={COLORS.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc — starts at top (rotation -90 deg) */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={animatedValue}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center} pointerEvents="none">
        {isComplete ? (
          <Text style={[styles.checkmark, { color: COLORS.progressComplete }]}>✓</Text>
        ) : (
          <>
            <Text style={styles.percentText}>{Math.round(clampedPercent)}%</Text>
            <Text style={styles.label}>today</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontFamily: "JetBrainsMono-Bold",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  checkmark: {
    fontSize: 28,
    fontWeight: "700",
  },
});

export default ProgressRing;
