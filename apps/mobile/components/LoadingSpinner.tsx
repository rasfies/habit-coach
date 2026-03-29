import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

interface LoadingSpinnerProps {
  /** Optional message below the spinner */
  message?: string;
  /** Whether to fill the entire parent (default true) */
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen = true }: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color="#4F46E5" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default LoadingSpinner;
