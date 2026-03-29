import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { Database } from "@habit-coach/db";

/**
 * Custom storage adapter using Expo SecureStore.
 * Persists the Supabase session token securely on device.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for React Native / Expo.
 * Uses SecureStore for session persistence (replaces localStorage).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
