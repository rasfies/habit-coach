import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { registerForPushNotificationsAsync } from "@/lib/notifications";

// Keep the splash screen visible until fonts + auth are ready
SplashScreen.preventAutoHideAsync();

function useAuthGuard(session: Session | null, initializing: boolean) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!session && !inAuthGroup) {
      // No session → force to login
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      // Has session but still on auth screens → go to tabs
      router.replace("/(tabs)");
    }
  }, [session, initializing, segments, router]);
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load custom fonts
  useEffect(() => {
    Font.loadAsync({
      "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
      "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
      "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
      "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
      "JetBrainsMono-Regular": require("../assets/fonts/JetBrainsMono-Regular.ttf"),
      "JetBrainsMono-Bold": require("../assets/fonts/JetBrainsMono-Bold.ttf"),
    })
      .catch(() => {
        // Fonts may not exist yet in the repo — graceful fallback to system fonts
      })
      .finally(() => {
        setFontsLoaded(true);
      });
  }, []);

  // Restore and listen to Supabase auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setInitializing(false);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Register push token after sign-in
      if (s) {
        registerForPushNotificationsAsync().catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide splash when both fonts and auth state are ready
  useEffect(() => {
    if (!initializing && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [initializing, fontsLoaded]);

  useAuthGuard(session, initializing);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen
          name="groups/[id]"
          options={{ headerShown: false, presentation: "card" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
