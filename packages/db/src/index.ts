/**
 * @habit-coach/db — Supabase client factory + shared TypeScript types
 *
 * Usage (server):
 *   import { createServerClient } from "@habit-coach/db/server";
 *
 * Usage (browser / React Native):
 *   import { createBrowserClient } from "@habit-coach/db/browser";
 *
 * Types:
 *   import type { Database, User, Habit, ... } from "@habit-coach/db";
 */

// Re-export all manual type stubs
// In TASK-005 these will be replaced by `supabase gen types typescript` output
export type {
  Json,
  User,
  Habit,
  HabitLog,
  Streak,
  Group,
  GroupMember,
  AIMessage,
  AnalyticsSnapshot,
  NotificationToken,
  UserInsert,
  HabitInsert,
  HabitLogInsert,
  StreakInsert,
  GroupInsert,
  GroupMemberInsert,
  AIMessageInsert,
  AnalyticsSnapshotInsert,
  NotificationTokenInsert,
  UserUpdate,
  HabitUpdate,
  StreakUpdate,
  GroupUpdate,
  NotificationTokenUpdate,
} from "./types";

/**
 * Database shape for Supabase generic client typing.
 * Extended in TASK-005 once schema is applied.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: import("./types").User;
        Insert: import("./types").UserInsert;
        Update: import("./types").UserUpdate;
      };
      habits: {
        Row: import("./types").Habit;
        Insert: import("./types").HabitInsert;
        Update: import("./types").HabitUpdate;
      };
      habit_logs: {
        Row: import("./types").HabitLog;
        Insert: import("./types").HabitLogInsert;
        Update: Partial<import("./types").HabitLogInsert>;
      };
      streaks: {
        Row: import("./types").Streak;
        Insert: import("./types").StreakInsert;
        Update: import("./types").StreakUpdate;
      };
      groups: {
        Row: import("./types").Group;
        Insert: import("./types").GroupInsert;
        Update: import("./types").GroupUpdate;
      };
      group_members: {
        Row: import("./types").GroupMember;
        Insert: import("./types").GroupMemberInsert;
        Update: Record<string, never>;
      };
      ai_messages: {
        Row: import("./types").AIMessage;
        Insert: import("./types").AIMessageInsert;
        Update: Record<string, never>;
      };
      analytics_snapshots: {
        Row: import("./types").AnalyticsSnapshot;
        Insert: import("./types").AnalyticsSnapshotInsert;
        Update: Record<string, never>;
      };
      notification_tokens: {
        Row: import("./types").NotificationToken;
        Insert: import("./types").NotificationTokenInsert;
        Update: import("./types").NotificationTokenUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
