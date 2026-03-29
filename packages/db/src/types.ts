/**
 * Database type stubs — generated types will replace this file in TASK-005.
 * Use `supabase gen types typescript` to auto-generate from the live schema.
 *
 * Manual stubs are here so TypeScript can compile before the Supabase project is provisioned.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─────────────────────────────────────────────
// Row types (what SELECT returns)
// ─────────────────────────────────────────────

export interface User {
  id: string; // uuid, matches Supabase Auth UID
  email: string;
  display_name: string;
  avatar_url: string | null;
  onboarding_complete: boolean;
  notification_enabled: boolean;
  reminder_time: string | null; // "HH:MM:SS" format
  created_at: string; // timestamptz ISO string
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  frequency: "daily"; // MVP: daily only
  reminder_time: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string; // "YYYY-MM-DD"
  completed: boolean;
  is_grace_day: boolean;
  created_at: string;
}

export interface Streak {
  id: string;
  habit_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  grace_days_used_this_week: number;
  last_completed_date: string | null; // "YYYY-MM-DD"
  last_streak_reset: string | null; // "YYYY-MM-DD"
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface AIMessage {
  id: string;
  user_id: string;
  message_date: string; // "YYYY-MM-DD"
  content: string;
  message_type: "daily" | "day1_welcome" | "streak_3" | "streak_7" | "streak_14" | "streak_30";
  habit_ids_referenced: string[] | null;
  model_used: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  snapshot_type: "weekly" | "monthly";
  period_start: string; // "YYYY-MM-DD"
  period_end: string;
  habit_id: string;
  completion_rate: number; // 0.00–100.00
  days_completed: number;
  days_possible: number;
  streak_at_end: number;
  created_at: string;
}

export interface NotificationToken {
  id: string;
  user_id: string;
  token: string;
  platform: "ios" | "android" | "web";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Insert types (what INSERT expects)
// ─────────────────────────────────────────────

export type UserInsert = Omit<User, "id" | "created_at" | "updated_at"> & {
  id: string; // must match Supabase Auth UID
};

export type HabitInsert = Omit<Habit, "id" | "created_at" | "updated_at">;

export type HabitLogInsert = Omit<HabitLog, "id" | "created_at">;

export type StreakInsert = Omit<Streak, "id" | "updated_at">;

export type GroupInsert = Omit<Group, "id" | "created_at" | "updated_at" | "member_count">;

export type GroupMemberInsert = Omit<GroupMember, "id" | "joined_at">;

export type AIMessageInsert = Omit<AIMessage, "id" | "created_at">;

export type AnalyticsSnapshotInsert = Omit<AnalyticsSnapshot, "id" | "created_at">;

export type NotificationTokenInsert = Omit<NotificationToken, "id" | "created_at" | "updated_at">;

// ─────────────────────────────────────────────
// Update types (what UPDATE expects)
// ─────────────────────────────────────────────

export type UserUpdate = Partial<
  Pick<User, "display_name" | "avatar_url" | "onboarding_complete" | "notification_enabled" | "reminder_time">
>;

export type HabitUpdate = Partial<
  Pick<Habit, "name" | "icon" | "reminder_time" | "sort_order" | "is_active">
>;

export type StreakUpdate = Partial<
  Pick<Streak, "current_streak" | "longest_streak" | "grace_days_used_this_week" | "last_completed_date" | "last_streak_reset">
>;

export type GroupUpdate = Partial<Pick<Group, "name">>;

export type NotificationTokenUpdate = Partial<Pick<NotificationToken, "is_active">>;
