import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

// Keep the splash screen visible until we finish loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Auth check and session restoration will be implemented in TASK-025
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <Stack>
        {/* Auth screens — no header */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* Main tab navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
