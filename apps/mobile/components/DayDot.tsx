import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

export type DayDotStatus = "logged" | "missed" | "grace" | "today" | "future";

const STATUS_COLORS: Record<DayDotStatus, string> = {
  logged: "#22C55E",   // success-500
  missed: "#D1D5DB",   // neutral-300
  grace: "#FBBF24",    // accent-400
  today: "#3B82F6",    // info-500
  future: "#E5E7EB",   // neutral-200
};

interface DayDotProps {
  status: DayDotStatus;
  size?: number;
}

export function DayDot({ status, size = 12 }: DayDotProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== "today") return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [status, pulseAnim]);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: STATUS_COLORS[status],
  };

  if (status === "today") {
    return (
      <View style={[styles.todayWrapper, { width: size + 4, height: size + 4 }]}>
        {/* Pulsing ring */}
        <Animated.View
          style={[
            styles.ring,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              borderColor: STATUS_COLORS.today,
              opacity: pulseAnim,
            },
          ]}
        />
        {/* Solid dot */}
        <View style={[dotStyle, styles.todayDot]} />
      </View>
    );
  }

  return <View style={dotStyle} />;
}

const styles = StyleSheet.create({
  todayWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
  },
  todayDot: {
    position: "absolute",
  },
});

export default DayDot;
